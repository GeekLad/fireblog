var WORDPRESS_PATHS = {
    blogTitle: "/rss/channel/title",
    blogUrl: "/rss/channel/link",
    posts: "/rss/channel/item",
    categories: "/rss/channel/wp:category",
    tags: "/rss/channel/wp:tag",
    authors: "/rss/channel/wp:author"
};
var WORDPRESS_NAMESPACES = {
    excerpt: "http://wordpress.org/export/1.2/excerpt/",
    content: "http://purl.org/rss/1.0/modules/content/",
    wfw: "http://wellformedweb.org/CommentAPI/",
    dc: "http://purl.org/dc/elements/1.1/",
    wp: "http://wordpress.org/export/1.2/"
};
var WordPressImport = (function () {
    function WordPressImport(xmlString) {
        this._authors = [];
        this._categories = [];
        this._tags = [];
        this._paths = {};
        this._posts = [];
        this._pages = [];
        this._attachments = [];
        this._doc = (new DOMParser()).parseFromString(xmlString, "application/xml");
        this._title = this._doc.evaluate(WORDPRESS_PATHS.blogTitle, this._doc, null, XPathResult.STRING_TYPE, null).stringValue;
        this._url = this._doc.evaluate(WORDPRESS_PATHS.blogUrl, this._doc, null, XPathResult.STRING_TYPE, null).stringValue;
        this._getAuthors();
        this._getCategoriesTags("category");
        this._getCategoriesTags("tag");
        this._getPosts();
    }
    Object.defineProperty(WordPressImport.prototype, "blogTitle", {
        get: function () {
            return this._title;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(WordPressImport.prototype, "blogUrl", {
        get: function () {
            return this._url;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(WordPressImport.prototype, "authors", {
        get: function () {
            return this._authors;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(WordPressImport.prototype, "posts", {
        get: function () {
            return this._posts;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(WordPressImport.prototype, "pages", {
        get: function () {
            return this._pages;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(WordPressImport.prototype, "attachments", {
        get: function () {
            return this._attachments;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(WordPressImport.prototype, "categories", {
        get: function () {
            return this._categories;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(WordPressImport.prototype, "tags", {
        get: function () {
            return this._tags;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(WordPressImport.prototype, "paths", {
        get: function () {
            return this._paths;
        },
        enumerable: true,
        configurable: true
    });
    WordPressImport.prototype._getAuthors = function () {
        var authors = [];
        var results = this._doc.evaluate(WORDPRESS_PATHS.authors, this._doc, this._resolver, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
        var author = results.iterateNext();
        while (author) {
            var newAuthor = {
                id: Number(author["getElementsByTagName"]("author_id")[0].innerHTML),
                email: author["getElementsByTagName"]("author_email")[0].innerHTML,
                userName: author["getElementsByTagName"]("author_login")[0].innerHTML,
                displayName: author["getElementsByTagName"]("author_display_name")[0].innerHTML.replace(/^<!\[CDATA\[|\]\]>$/g, ""),
            };
            this._authors.push(newAuthor);
            author = results.iterateNext();
        }
    };
    WordPressImport.prototype._getCategoriesTags = function (type) {
        switch (type) {
            case "category":
                var items = [];
                var newItem;
                var path = WORDPRESS_PATHS.categories;
                var slug = "category_nicename";
                var name = "cat_name";
                break;
            case "tag":
                var items = [];
                var newItem;
                var path = WORDPRESS_PATHS.tags;
                var slug = "tag_slug";
                var name = "tag_name";
                break;
        }
        var results = this._doc.evaluate(path, this._doc, this._resolver, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
        var item = results.iterateNext();
        while (item) {
            newItem = {
                id: Number(item["getElementsByTagName"]("term_id")[0].innerHTML),
                slug: item["getElementsByTagName"](slug)[0].innerHTML,
                displayName: item["getElementsByTagName"](name)[0].innerHTML.replace(/^<!\[CDATA\[|\]\]>$/g, ""),
                postPaths: []
            };
            items.push(newItem);
            item = results.iterateNext();
        }
        switch (type) {
            case "category":
                this._categories = items;
                break;
            case "tag":
                this._tags = items;
                break;
        }
    };
    WordPressImport.prototype._getPosts = function () {
        var posts = [];
        var item;
        var results = this._doc.evaluate(WORDPRESS_PATHS.posts, this._doc, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
        var post = results.iterateNext();
        while (post) {
            var post_type = post["getElementsByTagName"]("post_type")[0].innerHTML.replace(/^<!\[CDATA\[|\]\]>$/g, "");
            switch (post_type) {
                case "attachment":
                    item = {
                        id: Number(post["getElementsByTagName"]("post_id")[0].innerHTML),
                        parent: Number(post["getElementsByTagName"]("post_parent")[0].innerHTML),
                        url: post["getElementsByTagName"]("attachment_url")[0].innerHTML,
                        path: post["getElementsByTagName"]("attachment_url")[0].innerHTML.replace(this.blogUrl, ""),
                    };
                    this._attachments.push(item);
                    break;
                case "post":
                    item = {
                        id: Number(post["getElementsByTagName"]("post_id")[0].innerHTML),
                        postTime: (new Date(post["getElementsByTagName"]("post_date")[0].innerHTML)).getTime(),
                        originalUrl: post["getElementsByTagName"]("link")[0].innerHTML,
                        path: post["getElementsByTagName"]("link")[0].innerHTML.replace(this.blogUrl, ""),
                        status: post["getElementsByTagName"]("status")[0].innerHTML,
                        title: post["getElementsByTagName"]("title")[0].innerHTML,
                        content: post["getElementsByTagName"]("encoded")[0].innerHTML.replace(/^<!\[CDATA\[|\]\]>$/g, ""),
                    };
                    var parent = Number(post["getElementsByTagName"]("post_parent")[0].innerHTML);
                    if (parent != 0)
                        item.parent = parent;
                    this._posts.push(item);
                    break;
                case "page":
                    item = {
                        id: Number(post["getElementsByTagName"]("post_id")[0].innerHTML),
                        postTime: (new Date(post["getElementsByTagName"]("post_date")[0].innerHTML)).getTime(),
                        originalUrl: post["getElementsByTagName"]("link")[0].innerHTML,
                        path: post["getElementsByTagName"]("link")[0].innerHTML.replace(this.blogUrl, ""),
                        status: post["getElementsByTagName"]("status")[0].innerHTML,
                        title: post["getElementsByTagName"]("title")[0].innerHTML,
                        content: post["getElementsByTagName"]("encoded")[0].innerHTML.replace(/^<!\[CDATA\[|\]\]>$/g, ""),
                    };
                    var parent = Number(post["getElementsByTagName"]("post_parent")[0].innerHTML);
                    if (parent != 0)
                        item.parent = parent;
                    this._pages.push(item);
                    break;
            }
            this._addPathItem(post_type, item);
            this._getPostTags(post);
            post = results.iterateNext();
        }
    };
    WordPressImport.prototype._getPostTags = function (post) {
        var results = post["getElementsByTagName"]("category");
        var item;
        for (var x = 0; x < results.length; x++) {
            var type = results[x]["getAttribute"]("domain");
            switch (type) {
                case "post_tag":
                    item = this._getTag(results[x]["innerHTML"].replace(/^<!\[CDATA\[|\]\]>$/g, ""));
                    break;
                case "category":
                    item = this._getCategory(results[x]["innerHTML"].replace(/^<!\[CDATA\[|\]\]>$/g, ""));
                    break;
            }
            item.postPaths.push(post["getElementsByTagName"]("link")[0].innerHTML.replace(this.blogUrl, ""));
        }
    };
    WordPressImport.prototype._getCategory = function (category) {
        for (var x = 0; x < this._categories.length; x++) {
            if (this._categories[x].displayName == category || this._categories[x].slug == category)
                return this._categories[x];
        }
        return null;
    };
    WordPressImport.prototype._getTag = function (tag) {
        for (var x = 0; x < this._tags.length; x++) {
            if (this._tags[x].displayName == tag)
                return this._tags[x];
        }
        return null;
    };
    WordPressImport.prototype._addPathItem = function (type, item) {
        if (!this._paths[item.path])
            this._paths[item.path] = {
                type: type,
                item: item
            };
    };
    WordPressImport.prototype._getPathItem = function (path) {
        if (this._paths[path])
            return this._paths[path];
        return null;
    };
    WordPressImport.prototype.toJSON = function () {
        return {
            blogTitle: this.blogTitle,
            blogUrl: this.blogUrl,
            authors: this.authors,
            categories: this.categories,
            tags: this.tags,
            posts: this.posts,
            pages: this.pages,
            attachments: this.attachments,
            paths: this.paths,
        };
    };
    Object.defineProperty(WordPressImport.prototype, "toString", {
        get: function () {
            return JSON.stringify(this.toJSON(), null, 2);
        },
        enumerable: true,
        configurable: true
    });
    WordPressImport.prototype._resolver = function (ns) {
        return WORDPRESS_NAMESPACES[ns];
    };
    return WordPressImport;
}());
var StaticApp = (function () {
    function StaticApp() {
    }
    StaticApp.init = function () {
        StaticApp._reader.onload = StaticApp._readFile;
    };
    StaticApp.openFile = function (e) {
        StaticApp._reader.readAsText(e.target.files[0]);
    };
    StaticApp._readFile = function () {
        StaticApp._import = new WordPressImport(StaticApp._reader.result);
        $("#import_result").html("\n      Title: " + StaticApp._import.blogTitle + "<br>\n      URL: " + StaticApp._import.blogUrl + "<br>\n      # Authors: " + StaticApp._import.authors.length + "<br>\n      # Categories: " + StaticApp._import.categories.length + "<br>\n      # Tags: " + StaticApp._import.tags.length + "<br>\n      # Attachments: " + StaticApp._import.attachments.length + "<br>\n      # Posts: " + StaticApp._import.posts.length + "<br>\n      # Pages: " + StaticApp._import.pages.length + "<br>\n    ");
    };
    return StaticApp;
}());
StaticApp._reader = new FileReader();
StaticApp.init();
$("#import_file").change(StaticApp.openFile);
//# sourceMappingURL=main.js.map