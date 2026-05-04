# -*- coding: utf-8 -*-
"""
@Time ： 2026/5/3 19:22
@Auth ： keevinzha
@File ：markdown.py.py
@IDE ：PyCharm
"""
import re
import markdown
from markdown.extensions.toc import TocExtension
from markdown.extensions.codehilite import CodeHiliteExtension


def _add_default_lang(content, default='bash'):
    """Give unlabeled fenced code blocks a default language."""
    lines = content.split('\n')
    result = []
    in_fence = False
    fence_mark = ''
    for line in lines:
        if not in_fence:
            m = re.match(r'^(`{3,}|~{3,})\s*$', line)
            if m:
                fence_mark = m.group(1)
                result.append(fence_mark + default)
                in_fence = True
            else:
                result.append(line)
                lm = re.match(r'^(`{3,}|~{3,})', line)
                if lm:
                    in_fence = True
                    fence_mark = lm.group(1)
        else:
            result.append(line)
            if re.match(r'^' + re.escape(fence_mark[0]) + r'{' + str(len(fence_mark)) + r',}\s*$', line):
                in_fence = False
    return '\n'.join(result)


def render_markdown(content):
    content = _add_default_lang(content)
    md = markdown.Markdown(extensions=[
        TocExtension(baselevel=2),
        'fenced_code',
        'tables',
        CodeHiliteExtension(linenums=False, css_class='highlight', guess_lang=False),
    ])
    content_html = md.convert(content)
    toc_html = md.toc
    return content_html, toc_html