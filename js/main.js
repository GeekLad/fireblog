var xml2json;
var WORDPRESS_PATHS = {
    blogTitle: '/rss/channel/title',
    blogUrl: '/rss/channel/link',
    posts: '/rss/channel/item',
    categories: '/rss/channel/wp:category',
    tags: '/rss/channel/wp:tag'
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
        this._doc = (new DOMParser()).parseFromString(xmlString, "application/xml");
    }
    Object.defineProperty(WordPressImport.prototype, "blogTitle", {
        get: function () {
            return this._doc.evaluate(WORDPRESS_PATHS.blogTitle, this._doc, null, XPathResult.STRING_TYPE, null).stringValue;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(WordPressImport.prototype, "blogUrl", {
        get: function () {
            return this._doc.evaluate(WORDPRESS_PATHS.blogUrl, this._doc, null, XPathResult.STRING_TYPE, null).stringValue;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(WordPressImport.prototype, "posts", {
        get: function () {
            var posts = [];
            var results = this._doc.evaluate(WORDPRESS_PATHS.posts, this._doc, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
            var post = results.iterateNext();
            while (post) {
                posts.push({
                    id: Number(post["getElementsByTagName"]("post_id")[0].innerHTML),
                    postTime: (new Date(post["getElementsByTagName"]("post_date")[0].innerHTML)).getTime(),
                    type: post["getElementsByTagName"]("post_type")[0].innerHTML,
                    originalUrl: post["getElementsByTagName"]("link")[0].innerHTML,
                    path: post["getElementsByTagName"]("link")[0].innerHTML.replace(this.blogUrl, ""),
                    title: post["getElementsByTagName"]("title")[0].innerHTML,
                    content: post["getElementsByTagName"]("encoded")[0].innerHTML.replace(/^<!\[CDATA\[|\]\]>$/g, ""),
                    excerpt: post["getElementsByTagName"]("encoded")[1].innerHTML.replace(/^<!\[CDATA\[|\]\]>$/g, "")
                });
                post = results.iterateNext();
            }
            return posts;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(WordPressImport.prototype, "categories", {
        get: function () {
            return this._categoriesTags("category");
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(WordPressImport.prototype, "tags", {
        get: function () {
            return this._categoriesTags("tag");
        },
        enumerable: true,
        configurable: true
    });
    WordPressImport.prototype._categoriesTags = function (type) {
        switch (type) {
            case "category":
                var items = [];
                var path = WORDPRESS_PATHS.categories;
                var slug = "category_nicename";
                var name = "cat_name";
                break;
            case "tag":
                var items = [];
                var path = WORDPRESS_PATHS.tags;
                var slug = "tag_slug";
                var name = "tag_name";
                break;
        }
        var results = this._doc.evaluate(path, this._doc, this._resolver, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
        var item = results.iterateNext();
        while (item) {
            items.push({
                id: Number(item["getElementsByTagName"]("term_id")[0].innerHTML),
                slug: item["getElementsByTagName"](slug)[0].innerHTML,
                displayName: item["getElementsByTagName"](name)[0].innerHTML.replace(/^<!\[CDATA\[|\]\]>$/g, "")
            });
            item = results.iterateNext();
        }
        return items;
    };
    WordPressImport.prototype.toJSON = function () {
        return {
            blogTitle: this.blogTitle,
            blogUrl: this.blogUrl,
            posts: this.posts,
            categories: this.categories,
            tags: this.tags
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
        // var str = xml2json(doc);
        // var data = JSON.parse(str.replace(/^{\sundefined/, "{"));
        document.write('<pre>DONE\n');
        //        document.write(data);
        document.write('</pre>');
    };
    return StaticApp;
}());
StaticApp._reader = new FileReader();
StaticApp.init();
$("#import_file").change(StaticApp.openFile);
//# sourceMappingURL=main.js.map