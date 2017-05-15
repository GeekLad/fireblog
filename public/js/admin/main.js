var firebase;
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
    function WordPressImport(xmlString, importOptions) {
        this._authors = [];
        this._categories = [];
        this._tags = [];
        this._paths = {};
        this._posts = [];
        this._pages = [];
        this._attachments = [];
        this._comments = [];
        this._commentCount = 0;
        if (!importOptions) {
            this._importOptions = {
                postStatus: ["publish", "draft"],
                commentStatus: 1,
                excludeUnusedTags: true
            };
        }
        this._doc = (new DOMParser()).parseFromString(xmlString, "application/xml");
        this._title = this._doc.evaluate(WORDPRESS_PATHS.blogTitle, this._doc, null, XPathResult.STRING_TYPE, null).stringValue;
        this._url = this._doc.evaluate(WORDPRESS_PATHS.blogUrl, this._doc, null, XPathResult.STRING_TYPE, null).stringValue;
        this._getAuthors();
        this._getCategoriesTags("category");
        this._getCategoriesTags("tag");
        this._getPosts();
        // Get the total comment count
        this._commentCount = this._comments.reduce(function (total, thread) {
            return total + thread.commentCount;
        }, 0);
        // Remove unused tags/categories
        if (this._importOptions.excludeUnusedTags)
            this._removeUnusedTagsCategories();
    }
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
            comments: this.comments,
            commentCount: this.commentCount,
        };
    };
    Object.defineProperty(WordPressImport.prototype, "toString", {
        get: function () {
            return JSON.stringify(this.toJSON(), null, 2);
        },
        enumerable: true,
        configurable: true
    });
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
    Object.defineProperty(WordPressImport.prototype, "comments", {
        get: function () {
            return this._comments;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(WordPressImport.prototype, "commentCount", {
        get: function () {
            return this._commentCount;
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
        var status;
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
                    status = post["getElementsByTagName"]("status")[0].innerHTML.replace(/^<!\[CDATA\[|\]\]>$/g, "");
                    if (this._importOptions.postStatus.find(function (x) { return x == status; })) {
                        item = {
                            id: Number(post["getElementsByTagName"]("post_id")[0].innerHTML),
                            timestamp: (new Date(post["getElementsByTagName"]("post_date")[0].innerHTML.replace(/^<!\[CDATA\[|\]\]>$/g, ""))).getTime(),
                            originalUrl: post["getElementsByTagName"]("link")[0].innerHTML,
                            path: post["getElementsByTagName"]("link")[0].innerHTML.replace(this.blogUrl, ""),
                            status: status,
                            title: post["getElementsByTagName"]("title")[0].innerHTML,
                            author: post["getElementsByTagName"]("creator")[0].innerHTML.replace(/^<!\[CDATA\[|\]\]>$/g, ""),
                            content: post["getElementsByTagName"]("encoded")[0].innerHTML.replace(/^<!\[CDATA\[|\]\]>$/g, ""),
                        };
                        var parent = Number(post["getElementsByTagName"]("post_parent")[0].innerHTML);
                        if (parent != 0)
                            item.parent = parent;
                        this._posts.push(item);
                    }
                    else
                        item = null;
                    break;
                case "page":
                    status = post["getElementsByTagName"]("status")[0].innerHTML.replace(/^<!\[CDATA\[|\]\]>$/g, "");
                    if (this._importOptions.postStatus.find(function (x) { return x == status; })) {
                        item = {
                            id: Number(post["getElementsByTagName"]("post_id")[0].innerHTML),
                            timestamp: (new Date(post["getElementsByTagName"]("post_date")[0].innerHTML.replace(/^<!\[CDATA\[|\]\]>$/g, ""))).getTime(),
                            originalUrl: post["getElementsByTagName"]("link")[0].innerHTML,
                            path: post["getElementsByTagName"]("link")[0].innerHTML.replace(this.blogUrl, ""),
                            status: post["getElementsByTagName"]("status")[0].innerHTML.replace(/^<!\[CDATA\[|\]\]>$/g, ""),
                            title: post["getElementsByTagName"]("title")[0].innerHTML,
                            author: post["getElementsByTagName"]("creator")[0].innerHTML.replace(/^<!\[CDATA\[|\]\]>$/g, ""),
                            content: post["getElementsByTagName"]("encoded")[0].innerHTML.replace(/^<!\[CDATA\[|\]\]>$/g, ""),
                        };
                        var parent = Number(post["getElementsByTagName"]("post_parent")[0].innerHTML);
                        if (parent != 0)
                            item.parent = parent;
                        this._pages.push(item);
                    }
                    else
                        item = null;
                    break;
            }
            if (item) {
                this._addPathItem(post_type, item);
                this._addPostTags(post);
                if (post_type == "post" || post_type == "page")
                    this._addComments(item, post);
            }
            post = results.iterateNext();
        }
    };
    WordPressImport.prototype._addPostTags = function (post) {
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
    WordPressImport.prototype._removeUnusedTagsCategories = function () {
        for (var x = this._tags.length - 1; x >= 0; x--) {
            if (this._tags[x].postPaths.length == 0)
                this._tags.splice(x, 1);
        }
        for (x = this._categories.length - 1; x >= 0; x--) {
            if (this._categories[x].postPaths.length == 0)
                this._categories.splice(x, 1);
        }
    };
    WordPressImport.prototype._addComments = function (post, postXML) {
        var results = postXML["getElementsByTagName"]("comment");
        var root_comments = [];
        var child_comments = [];
        var item;
        var approved;
        for (var x = 0; x < results.length; x++) {
            approved = Number(results[x]["getElementsByTagName"]("comment_approved")[0].innerHTML.replace(/^<!\[CDATA\[|\]\]>$/g, ""));
            if (approved == 1) {
                item = {
                    id: Number(results[x]["getElementsByTagName"]("comment_id")[0].innerHTML),
                    email: results[x]["getElementsByTagName"]("comment_author_email")[0].innerHTML.replace(/^<!\[CDATA\[|\]\]>$/g, ""),
                    url: results[x]["getElementsByTagName"]("comment_author_url")[0].innerHTML,
                    timestamp: Number((new Date(results[x]["getElementsByTagName"]("comment_date")[0].innerHTML.replace(/^<!\[CDATA\[|\]\]>$/g, ""))).getTime()),
                    content: results[x]["getElementsByTagName"]("comment_content")[0].innerHTML.replace(/^<!\[CDATA\[|\]\]>$/g, ""),
                    approved: approved,
                };
                if (results[x]["getElementsByTagName"]("comment_parent")[0].innerHTML != "0") {
                    item.parent_id = Number(results[x]["getElementsByTagName"]("comment_parent")[0].innerHTML);
                    child_comments.push(item);
                }
                else
                    root_comments.push(item);
            }
        }
        var commentCount = root_comments.length + child_comments.length;
        if (commentCount > 0) {
            // Move child comments under the parents
            for (x = 0; x < child_comments.length; x++) {
                // Look for the parent in the root_comments
                item = this._findComment(child_comments[x].parent_id, root_comments);
                // If it's not a root comment, then it's a child comment
                if (!item)
                    item = this._findComment(child_comments[x].parent_id, child_comments);
                // Add the child comment to the parent comment
                if (!item.responses)
                    item.responses = [child_comments[x]];
                else
                    item.responses.push(child_comments[x]);
            }
            var thread = {
                path: post.path,
                commentCount: commentCount,
                comments: root_comments
            };
            post.comments = root_comments;
            this._comments.push(thread);
        }
    };
    WordPressImport.prototype._findComment = function (id, comments) {
        for (var x = 0; x < comments.length; x++) {
            if (comments[x].id == id)
                return comments[x];
        }
        return null;
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
    WordPressImport.prototype._resolver = function (ns) {
        return WORDPRESS_NAMESPACES[ns];
    };
    return WordPressImport;
}());
var App = (function () {
    function App() {
        var _this = this;
        this._reader = new FileReader();
        this._loginMenu = $("#login-menu");
        this._loginButton = $("#login-button");
        this._logoutButton = $("#logout-button");
        this._importButton = $("#import-file");
        this._importMenu = $("#import-menu");
        this._provider = new firebase.auth.GoogleAuthProvider();
        this._loginStatus = false;
        // Set up the events for the import button
        this._reader.onload = function () { return _this._readFile; };
        this._importButton.change(function (e) { return _this.openFile(e); });
        // Set up login/logout events
        $(this._loginButton).click(function () { return _this.login(); });
        $(this._logoutButton).click(function () { return _this.logout(); });
        // Listener for login status
        firebase.auth().onAuthStateChanged(function (user) { return _this._loggedIn(user); });
    }
    App.prototype._loggedIn = function (loggedIn) {
        if (loggedIn) {
            this._loginStatus = true;
            this._loginButton.addClass("hidden");
            this._logoutButton.removeClass("hidden");
            this._importMenu.removeClass("hidden");
        }
        else {
            this._loginStatus = false;
            this._loginButton.removeClass("hidden");
            this._logoutButton.addClass("hidden");
            this._importMenu.addClass("hidden");
        }
    };
    App.prototype.openFile = function (e) {
        this._reader.readAsText(e.target.files[0]);
    };
    App.prototype.login = function () {
        var _this = this;
        firebase.auth().signInWithPopup(this._provider).then(function (result) { return _this._loginHandler(result); }).catch(function (error) { return _this._loginErrorHandler(error); });
    };
    App.prototype.logout = function () {
        firebase.auth().signOut();
        this._loggedIn(false);
    };
    App.prototype._loginHandler = function (result) {
        var _this = this;
        this._loggedIn(result.user);
        // This gives you a Google Access Token. You can use it to access the Google API.
        this._credential = result.credential;
        // The signed-in user info.
        this._user = result.user;
        // Test the function
        this._firebaseFunction("isAdmin", function (data) { return _this._functionTestHandler(data); });
    };
    App.prototype._loginErrorHandler = function (error) {
        // Handle Errors here.
        var errorCode = error.code;
        var errorMessage = error.message;
        // The email of the user's account used.
        var email = error.email;
        // The firebase.auth.AuthCredential type that was used.
        var credential = error.credential;
        // ...
    };
    App.prototype._functionTestHandler = function (response) {
        alert("It worked!");
        console.log(response);
    };
    App.prototype._firebaseFunction = function (functionName, cb) {
        var _this = this;
        firebase.auth().currentUser.getToken().then(function (token) { return _this._firebaseAjax(token, functionName, cb); });
    };
    App.prototype._firebaseAjax = function (token, functionName, cb) {
        $.ajax({
            url: "https://us-central1-fireblog-653d3.cloudfunctions.net/" + functionName,
            headers: {
                "Authorization": "Bearer " + token
            },
            type: "GET",
            //      cache: false,
            success: function (data) { return cb(data); },
        });
    };
    App.prototype._dbTest = function () {
        firebase.database().ref().child("Posts").set({
            timestamp: (new Date().getTime()),
            title: "Testing",
            content: "Did this work?"
        });
    };
    App.prototype._readFile = function () {
        this._import = new WordPressImport(this._reader.result);
        $("#import_result").html("\n      Title: " + this._import.blogTitle + "<br>\n      URL: " + this._import.blogUrl + "<br>\n      # Authors: " + this._import.authors.length + "<br>\n      # Categories: " + this._import.categories.length + "<br>\n      # Tags: " + this._import.tags.length + "<br>\n      # Attachments: " + this._import.attachments.length + "<br>\n      # Posts: " + this._import.posts.length + "<br>\n      # Pages: " + this._import.pages.length + "<br>\n      # Comment Threads: " + this._import.comments.length + "<br>\n      # Total Comment Count: " + this._import.commentCount + "<br>\n    ");
    };
    return App;
}());
var app = new App;
//# sourceMappingURL=main.js.map