"use strict";
var conn = require("./index");
var Posts = /** @class */ (function () {
    function Posts() {
        // 1 page = 40 posts
        this.getAll = function (page) { return new Promise(function (resolve, reject) {
            if (page !== page || typeof page !== "number")
                reject("[Posts getAll]Page not supplied");
            var query = "SELECT *\n                FROM posts \n                LIMIT 40 OFFSET " + page * 40;
            conn.query(query, function (err, data) {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(data);
                }
            });
        }); };
        this.getOneBySlug = function (slug) { return new Promise(function (resolve, reject) {
            if (!slug)
                reject("Expected a slug");
            if (typeof slug !== "string")
                reject("Expected slug to be a string");
            var query = "SELECT posts.*, \n                comments.id as commentId,\n                comments.date as commentDate,\n                comments.body as commentBody,\n                members.username as commentAuthor\n            FROM posts \n            LEFT JOIN comments\n                ON posts.id=comments.postId\n            LEFT JOIN members\n                ON members.id=comments.authorId\n            WHERE slug=\"" + slug + "\"";
            try {
                conn.query(query, function (err, data) {
                    if (err)
                        reject(err);
                    else
                        resolve(data);
                });
            }
            catch (err) {
                reject(err);
            }
        }); };
        this.getByRegExp = function (slug) { return new Promise(function (resolve, reject) {
            if (!slug)
                reject("Expected a slug");
            if (typeof slug !== "string")
                reject("Expected slug to be a string");
            var query = "SELECT *\n            FROM posts\n            WHERE slug REGEXP \"" + slug + "\"\n            OR title REGEXP \"" + slug + "\"\n            OR description REGEXP \"" + slug + "\"\n            LIMIT 40 OFFSET 0";
            try {
                conn.query(query, function (err, data) {
                    if (err)
                        reject(err);
                    else
                        resolve(data);
                });
            }
            catch (err) {
                reject(err);
            }
        }); };
        this.create = function (post) { return new Promise(function (resolve, reject) {
            if (!post.date || !post.authorID || !post.image || !post.title || !post.topic) {
                reject("some fields are missing");
            }
            var query = "INSERT INTO \n                posts(authorID, title, topic, image, date) \n                values(" + post.authorID + ", \"" + post.title + "\", \n                    \"" + post.topic + "\", \"" + post.image + "\", \"" + post.date + "\")";
            conn.query(query, function (err) {
                if (err)
                    reject(err);
                else
                    resolve("created a post");
            });
        }); };
        this.getOneById = function (id) { return new Promise(function (resolve, reject) {
            if (typeof id !== "number" || id !== id)
                reject("Post ID not supplied");
            var sql = "SELECT posts.*, \n                comments.id as commentId,\n                comments.date as commentDate,\n                comments.body as commentBody,\n                members.username as commentAuthor\n            FROM posts \n            LEFT JOIN comments\n                ON posts.id=comments.postId\n            LEFT JOIN members\n                ON members.id=comments.authorId\n            WHERE posts.id=" + id;
            try {
                conn.query(sql, function (err, posts) {
                    if (err)
                        reject(err);
                    else
                        resolve(posts);
                });
            }
            catch (error) {
                reject(error);
            }
        }); };
    }
    return Posts;
}());
module.exports.Posts = Posts;
