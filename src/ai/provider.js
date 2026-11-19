export function createAIProvider({baseURL='https://api.deepseek.com',model='deepseek-flash',apiKey='',proxyURL='',offline=false,onModel}={}) {
  return async function complete(messages, signal) {
    if (offline || (!proxyURL && !apiKey.trim())) throw Error('NO_KEY');
    const url = new URL(proxyURL || baseURL);
    if (url.username || url.password || url.search || url.hash ||
        (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['localhost','127.0.0.1'].includes(url.hostname)))) throw Error('ENDPOINT');
    if (!proxyURL) url.pathname = url.pathname.replace(/\/$/,'') + '/chat/completions';
    const timeout = AbortSignal.timeout(20000);
    try {
      const response = await fetch(url, {
        method:'POST', redirect:'error', credentials:'omit', referrerPolicy:'no-referrer',
        signal:signal ? AbortSignal.any([timeout,signal]) : timeout,
        headers:{'Content-Type':'application/json',...(!proxyURL ? {Authorization:'Bearer '+apiKey.trim()} : {})},
        body:JSON.stringify({model,messages,response_format:{type:'json_object'},stream:false,max_tokens:1600,
          ...(url.hostname==='api.deepseek.com' ? {thinking:{type:'disabled'}} : {})}),
      });
      if (!response.ok) throw Error('HTTP_'+response.status);
      const data = await response.json();
      const choice = data?.choices?.[0];
      if (choice?.finish_reason==='length') throw Error('TRUNCATED');
      if (typeof choice?.message?.content!=='string' || !choice.message.content.trim()) throw Error('EMPTY');
      if (choice.finish_reason!=='stop') throw Error('INCOMPLETE');
      const result = JSON.parse(choice.message.content);
      const reportedModel = typeof data.model === 'string' ? data.model.trim() : '';
      if (reportedModel && !signal?.aborted) onModel?.(reportedModel);
      return result;
    } catch (error) {
      if (signal?.aborted) throw Error('CANCELLED');
      if (timeout.aborted || error.name==='TimeoutError') throw Error('TIMEOUT');
      if (error instanceof SyntaxError) throw Error('INVALID_JSON');
      if (error instanceof TypeError) throw Error(globalThis.navigator?.onLine===false?'OFFLINE_NETWORK':'NETWORK_OR_CORS');
      throw error;
    }
  };
}
