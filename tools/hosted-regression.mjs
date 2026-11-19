import {writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {setTimeout as delay} from 'node:timers/promises';
import {buildPackEvaluationContext,buildMessages,validateVerdicts} from '../src/ai/judge.js';
import scenarios from '../src/ai/demo-scenarios.json' with {type:'json'};
import core from '../data/packs/unscripted-core.v1.json' with {type:'json'};
import intro from '../data/packs/unscripted-intro.v1.json' with {type:'json'};

function preparedCases() {
  const packs = [core,intro];
  return scenarios.map(scenario => {
    const pack = packs.find(p => p.packId === scenario.packId && p.packVersion === scenario.packVersion);
    if (!pack) throw Error('Unknown scenario pack version');
    const context = buildPackEvaluationContext(pack,scenario.questionId,scenario.layerId,'en');
    const expected = new Map(scenario.verdicts.map(row => [row.pointId,row.light]));
    if (expected.size !== context.criteria.length || !context.criteria.every(row => expected.has(row.pointId)))
      throw Error('Scenario rubric differs from the pack');
    return {context, expected, answer:scenario.answer};
  });
}

function compare(result, context, expected, answer, counts, overGreen) {
  if (Array.isArray(result?.verdicts)) {
    counts.badQuotes += result.verdicts.filter(row =>
      typeof row?.quote === 'string' && row.quote !== '' && !answer.includes(row.quote)).length;
  }
  const checked = validateVerdicts(result,context.criteria,answer,context.language);
  const raw = new Map(result.verdicts.map(row => [row.pointId,row.light]));
  for (const {pointId,light} of checked.verdicts) {
    const wanted = expected.get(pointId);
    const actual = raw.get(pointId);
    counts.compared++;
    if (wanted === actual) counts.matches++;
    if (wanted === light) counts.displayMatches++;
    if (actual === 'green' && wanted !== 'green') {
      overGreen.push({pointId,wanted,display:light});
    }
  }
}

export async function runHostedRegression(url, {request=fetch, pause=delay}={}) {
  const cases = preparedCases();
  const counts = {total:cases.reduce((sum,item) => sum + item.context.criteria.length,0),
    compared:0,matches:0,displayMatches:0,badQuotes:0,jsonFailures:0};
  const overGreen = [];
  const rows = [];
  for (const [i,{context,expected,answer}] of cases.entries()) {
    if (i) await pause(11000);
    const {questionId,layer} = context;
    const started = performance.now();
    let status = 'Network failure or timeout';
    let model = '';
    try {
      const res = await request(url,{
        method:'POST',redirect:'error',signal:AbortSignal.timeout(20000),
        headers:{'Origin':'http://localhost:5174','Content-Type':'application/json'},
        body:JSON.stringify({messages:buildMessages(context,answer),
          response_format:{type:'json_object'},stream:false,max_tokens:1600}),
      });
      status = 'HTTP '+res.status;
      if (!res.ok) {
        if (res.status === 502 && (await res.json().catch(() => null))?.error === 'INVALID_UPSTREAM_JSON')
          counts.jsonFailures++;
      } else {
        let completion;
        try {
          const wrapper = await res.json();
          model = typeof wrapper?.model === 'string' ? wrapper.model : '';
          if (typeof wrapper?.choices?.[0]?.message?.content !== 'string') throw Error('INVALID_JSON');
          completion = {value:JSON.parse(wrapper.choices[0].message.content)};
        } catch {
          counts.jsonFailures++;
          status = 'Invalid JSON';
        }
        if (completion) {
          try {
            compare(completion.value,context,expected,answer,counts,overGreen);
          } catch {
            status = 'Invalid verdict contract';
          }
        }
      }
    } catch {
      // Request errors have no stable contract. Keep only the status above.
    }
    rows.push({questionId,layer,status,model,ms:Math.round(performance.now()-started)});
    console.log(questionId,layer,status,rows.at(-1).ms+' ms');
  }
  return {rows,counts,overGreen};
}

function formatReport({rows,counts,overGreen}) {
  const percent = n => counts.compared ? (100*n/counts.compared).toFixed(1)+'%' : 'N/A';
  const cleanCell = s => s.replace(/[^\w./@ -]/g,'');
  return [
    '# Hosted proxy regression', '', 'Run at '+new Date().toISOString(), '',
    '* Model agreement with preset lamps: '+percent(counts.matches)+
      ' ('+counts.matches+'/'+counts.compared+' rubric points).',
    '* Agreement after frontend validation: '+percent(counts.displayMatches)+'.',
    '* Points covered: '+counts.compared+'/'+counts.total+'. Failed requests are excluded from agreement.',
    '* Non-empty quotes absent from sample answers: '+counts.badQuotes+'.',
    '* JSON parsing failures including Worker rejections: '+counts.jsonFailures+'.',
    '* Model Greens on preset non-Green points: '+overGreen.length+'.', '',
    ...(overGreen.length > 1 ? ['**More than one model Green disagreed with a non-Green preset.** Set MODEL to '+
      '@cf/openai/gpt-oss-120b and rerun for comparison.', ''] : []),
    ...overGreen.map(({pointId,wanted,display}) => '* `'+pointId+'` · preset '+wanted+' · frontend '+display),
    '', '| Question | Layer | Model | Result | Duration (ms) |','| --- | --- | --- | --- | ---: |',
    ...rows.map(row => '| '+[row.questionId,row.layer,cleanCell(row.model),row.status,row.ms].join(' | ')+' |'),
    '', 'The presets are comparison fixtures. Differences still require human review.', '',
  ].join('\n');
}

async function main() {
  const [flag,address,...extra] = process.argv.slice(2);
  if (flag !== '--url' || !address || extra.length) throw Error('Usage: node tools/hosted-regression.mjs --url <Worker URL>');
  const url = new URL(address);
  if (url.username || url.password || url.search || url.hash ||
      (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['localhost','127.0.0.1'].includes(url.hostname))))
    throw Error('Use an HTTPS Worker URL or a local HTTP development URL.');
  const result = await runHostedRegression(url);
  await writeFile(new URL('../docs/HOSTED_REGRESSION.md',import.meta.url),formatReport(result),'utf8');
  if (result.rows.some(row => row.status !== 'HTTP 200')) process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
