# -*- coding: utf-8 -*-
"""
@Time ： 2026/5/3 19:22
@Auth ： keevinzha
@File ：markdown.py.py
@IDE ：PyCharm
"""
import markdown
from markdown.extensions.toc import TocExtension

def render_markdown(content):
    md = markdown.Markdown(extensions=[
        TocExtension(baselevel=2),
        'fenced_code',
        'tables',
        'codehilite',
    ])
    content_html = md.convert(content)
    toc_html = md.toc
    return content_html, toc_html