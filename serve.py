#!/usr/bin/env python3
"""Static preview server for the presentation.

Python's stock http.server sends no cache directives, so browsers reuse old ES modules
and report exports as missing after an edit. Every response here is marked no-store.
"""
import sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer


class NoCacheHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, must-revalidate')
        self.send_header('Expires', '0')
        super().end_headers()


if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 4286
    handler = partial(NoCacheHandler, directory=None)
    print(f'Presentation running at http://127.0.0.1:{port}/  (press Ctrl+C to stop)')
    ThreadingHTTPServer(('127.0.0.1', port), handler).serve_forever()
