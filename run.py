# -*- coding: utf-8 -*-
"""
@Time ： 2026/5/3 15:31
@Auth ： keevinzha
@File ：run.py
@IDE ：PyCharm
"""
import os
from app import create_app, db
from app.models import User, Category, Tag, Series, Article

app = create_app(os.getenv('FLASK_CONFIG', 'default'))

@app.shell_context_processor
def make_shell_context():
    return dict(db=db, User=User, Category=Category,
                Tag=Tag, Series=Series, Article=Article)

@app.cli.command()
def create_admin():
    """创建管理员账号"""
    from app.models import User
    username = input('用户名: ')
    email = input('邮箱: ')
    password = input('密码: ')
    user = User(username=username, email=email, is_admin=True)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()
    print('管理员创建成功')

if __name__ == '__main__':
    app.run()