#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
塔罗占卜本地服务器（支持 HTTP Range 请求）
用法： python3 server.py [端口]
默认端口 8123。支持音频进度条拖拽 seek。
"""
import os, re, sys
from http.server import HTTPServer, SimpleHTTPRequestHandler

class RangeHTTPRequestHandler(SimpleHTTPRequestHandler):
    server_version = "RangeHTTP/1.0"

    def send_head(self):
        path = self.translate_path(self.path)
        if os.path.isdir(path):
            return super().send_head()
        if not os.path.isfile(path):
            return super().send_head()
        size = os.path.getsize(path)
        ctype = self.guess_type(path)

        # 处理 Range 请求（音频 seek 需要）
        rng = self.headers.get('Range')
        if rng:
            m = re.match(r'bytes=(\d*)-(\d*)', rng.strip(), re.I)
            if m:
                try:
                    start = int(m.group(1)) if m.group(1) else 0
                    end = int(m.group(2)) if m.group(2) else size - 1
                    if start < 0: start = 0
                    if end >= size: end = size - 1
                    if start > end:
                        self.send_error(416, "Requested Range Not Satisfiable")
                        return None
                    length = end - start + 1
                    self.send_response(206)
                    self.send_header('Content-type', ctype)
                    self.send_header('Accept-Ranges', 'bytes')
                    self.send_header('Content-Range', f'bytes {start}-{end}/{size}')
                    self.send_header('Content-Length', str(length))
                    self.send_header('Last-Modified', self.date_time_string(os.path.getmtime(path)))
                    self.end_headers()
                    f = open(path, 'rb')
                    f.seek(start)
                    return f
                except (ValueError, OSError):
                    pass

        # 无 Range：返回完整文件
        self.send_response(200)
        self.send_header('Content-type', ctype)
        self.send_header('Accept-Ranges', 'bytes')
        self.send_header('Content-Length', str(size))
        self.send_header('Last-Modified', self.date_time_string(os.path.getmtime(path)))
        self.end_headers()
        return open(path, 'rb')

if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8123
    url = f"http://127.0.0.1:{port}"
    print("=" * 52)
    print("  月 下 塔 罗  已启动！")
    print(f"  请在浏览器打开： {url}")
    print("  （正在尝试自动打开浏览器…）")
    try:
        import threading, webbrowser
        threading.Timer(1.2, lambda: webbrowser.open(url)).start()
    except Exception:
        pass
    print("  按 Ctrl + C 可停止服务器")
    print("=" * 52)
    HTTPServer(('0.0.0.0', port), RangeHTTPRequestHandler).serve_forever()
