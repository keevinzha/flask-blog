# -*- coding: utf-8 -*-
"""
@Time ： 2026/5/4 13:39
@Auth ： keevinzha
@File ：migrate_comments.py
@IDE ：PyCharm
"""
import json
import pymysql

with open('Comment_20260428_150713.json', 'r') as f:
    comments = json.load(f)

db = pymysql.connect(
    host='127.0.0.1',
    user='root',
    password='Gky@981021',
    database='waline',
    charset='utf8mb4'
)
cursor = db.cursor()

def convert_url(old_url):
    if old_url.startswith('/article/'):
        slug = old_url.replace('/article/', '').replace('_', '-')
        return f'/blog/{slug}'
    return old_url

def convert_time(t):
    if not t:
        return None
    return t.replace('T', ' ').replace('Z', '').split('.')[0]

id_map = {}
for c in comments:
    url = convert_url(c.get('url', ''))
    cursor.execute("""
        INSERT INTO wl_Comment (comment, ip, link, mail, nick, status, ua, url, createdAt, insertedAt, updatedAt, `like`)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """, (
        c.get('comment', ''),
        c.get('ip', ''),
        c.get('link', ''),
        c.get('mail', ''),
        c.get('nick', '匿名'),
        c.get('status', 'approved'),
        c.get('ua', ''),
        url,
        convert_time(c.get('createdAt')),
        convert_time(c.get('insertedAt')),
        convert_time(c.get('updatedAt')),
        c.get('like', 0),
    ))
    new_id = cursor.lastrowid
    id_map[c['objectId']] = new_id

db.commit()

for c in comments:
    new_id = id_map[c['objectId']]
    pid = id_map.get(c.get('pid', ''))
    rid = id_map.get(c.get('rid', ''))
    if pid or rid:
        cursor.execute("""
            UPDATE wl_Comment SET pid=%s, rid=%s WHERE id=%s
        """, (pid, rid, new_id))

db.commit()
print(f'迁移完成，共 {len(comments)} 条评论')
db.close()