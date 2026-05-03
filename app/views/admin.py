# -*- coding: utf-8 -*-
"""
@Time ： 2026/5/3 16:05
@Auth ： keevinzha
@File ：admin.py
@IDE ：PyCharm
"""
from flask import Blueprint, render_template, redirect, url_for, request, flash
from flask_login import login_user, logout_user, login_required, current_user
from app import db
from app.models import User, Article, Category, Tag, Series
from slugify import slugify

admin = Blueprint('admin', __name__)

@admin.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('admin.dashboard'))
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        user = User.query.filter_by(username=username).first()
        if user and user.check_password(password):
            login_user(user)
            return redirect(url_for('admin.dashboard'))
        flash('用户名或密码错误')
    return render_template('admin/login.html')

@admin.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('main.index'))

@admin.route('/')
@login_required
def dashboard():
    article_count = Article.query.count()
    published_count = Article.query.filter_by(is_published=True).count()
    category_count = Category.query.count()
    tag_count = Tag.query.count()
    return render_template('admin/dashboard.html',
                           article_count=article_count,
                           published_count=published_count,
                           category_count=category_count,
                           tag_count=tag_count)

@admin.route('/articles')
@login_required
def articles():
    page = request.args.get('page', 1, type=int)
    pagination = Article.query.order_by(Article.created_at.desc())\
        .paginate(page=page, per_page=20)
    return render_template('admin/articles.html', pagination=pagination)

@admin.route('/articles/new', methods=['GET', 'POST'])
@login_required
def new_article():
    if request.method == 'POST':
        article = Article(
            title=request.form.get('title'),
            slug=slugify(request.form.get('slug') or request.form.get('title')),
            summary=request.form.get('summary'),
            content=request.form.get('content'),
            category_id=request.form.get('category_id') or None,
            is_published=bool(request.form.get('is_published')),
            is_recommended=bool(request.form.get('is_recommended')),
        )
        db.session.add(article)
        db.session.commit()
        return redirect(url_for('admin.articles'))
    categories = Category.query.all()
    tags = Tag.query.all()
    series_list = Series.query.all()
    return render_template('admin/new_article.html',
                           categories=categories,
                           tags=tags,
                           series_list=series_list)