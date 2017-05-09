var xml2json;
var WORDPRESS_PATHS = {
    blogTitle: '/rss/channel/title',
    blogUrl: '/rss/channel/link',
    posts: '/rss/channel/item'
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
    WordPressImport.prototype.toJSON = function () {
        return {
            blogTitle: this.blogTitle,
            blogUrl: this.blogUrl,
            posts: this.posts
        };
    };
    Object.defineProperty(WordPressImport.prototype, "toString", {
        get: function () {
            return JSON.stringify(this.toJSON(), null, 2);
        },
        enumerable: true,
        configurable: true
    });
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