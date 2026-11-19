"""Run the integration fixture against an isolated copy of a packaged site."""
import functools
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

chrome = (shutil.which('google-chrome') or shutil.which('chromium')
          or str(Path(os.environ.get('ProgramFiles', '.')) / 'Google/Chrome/Application/chrome.exe'))
with tempfile.TemporaryDirectory() as temporary:
    root = Path(temporary)
    site = root / 'site'
    shutil.copytree(sys.argv[1], site)
    shutil.copyfile(Path(__file__).with_name('ai2.html'), site / 'ai2.html')
    handler = functools.partial(SimpleHTTPRequestHandler, directory=site)
    with ThreadingHTTPServer(('127.0.0.1', 0), handler) as server:
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        try:
            result = subprocess.run([chrome, '--headless', '--disable-gpu', '--no-first-run',
                '--user-data-dir=' + str(root / 'profile'), '--virtual-time-budget=60000', '--dump-dom',
                f'http://127.0.0.1:{server.server_port}/ai2.html'], capture_output=True, timeout=60)
        finally:
            server.shutdown()
            thread.join()
    import re
    status = re.search(rb'<pre id="result">([^<]*)</pre>', result.stdout)
    if result.returncode or not status or status[1] != b'AI2_BROWSER_PASS':
        sys.exit(status[1].decode() if status else 'Chrome did not return a result')
    print('AI2_BROWSER_PASS')
