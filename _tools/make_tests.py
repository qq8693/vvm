# -*- coding: utf-8 -*-
"""生成两个测试用 bat：
   _fallback.bat  —— 把 where git 换成查一个不存在的命令，强制走「PATH 里没有 git」的兜底分支
   _normal.bat    —— 原样，走正常分支
两个都 cd 到项目绝对路径，避免在 _tools 下跑错目录。
"""
import os

ROOT = r'C:\Users\Administrator\WorkBuddy\WKBD\shop'
src = os.path.join(ROOT, '一键上传到GitHub.bat')
out = os.path.join(ROOT, '_tools')

t = open(src, 'rb').read().decode('gbk')
t = t.replace('cd /d "%~dp0"', 'cd /d "%s"' % ROOT)

fb = t.replace('where git >nul 2>&1', 'where git_zzz_not_exist >nul 2>&1')
open(os.path.join(out, '_fallback.bat'), 'wb').write(fb.encode('gbk'))

nm = t.replace('ping -n 6', 'ping -n 2')
open(os.path.join(out, '_normal.bat'), 'wb').write(nm.encode('gbk'))

print('已生成 _fallback.bat 和 _normal.bat')
