import scenarios from './demo-scenarios.json' with {type:'json'};
import {validateVerdicts} from './judge.js';

export function openDemo(context) {
  const scenario = scenarios.find(row => row.packId === context.packId &&
    row.packVersion === context.packVersion && row.questionId === context.questionId && row.layerId === context.layer);
  if (!scenario) throw Error('MISSING_SCENARIO');
  const {answer, verdicts, followUp} = scenario;
  return {answer, ...validateVerdicts({verdicts, followUp}, context.criteria, answer)};
}
