const WORDPRESS_PATHS = {
  blogTitle: "/rss/channel/title",
  blogUrl: "/rss/channel/link",
  posts: "/rss/channel/item",
  categories: "/rss/channel/wp:category",
  tags: "/rss/channel/wp:tag",
  authors: "/rss/channel/wp:author"
}

const WORDPRESS_NAMESPACES = {
	excerpt: "http://wordpress.org/export/1.2/excerpt/",
	content: "http://purl.org/rss/1.0/modules/content/",
	wfw: "http://wellformedweb.org/CommentAPI/",
	dc: "http://purl.org/dc/elements/1.1/",
	wp: "http://wordpress.org/export/1.2/"  
}

interface Category {
  id:number;
  slug:string;
  displayName:string;
  postPaths:Array<string>;
}

interface Tag {
  id:number;
  slug:string;
  displayName:string;
  postPaths:Array<string>;
}

interface Post {
  id:number;
  parent?:number;
  timestamp:number;
  originalUrl:string;
  path:string;
  status:string;
  author:string;
  title:string;
  content:string;
}

interface Page extends Post { }

interface Attachment {
  id:number;
  parent:number;
  url:string;
  path:string;
}

interface Path {
  type:string;
  item:Post|Page|Attachment;
}

interface PathCollection {
  [path:string]:Path;
}

interface Author {
  id:number;
  email:string;
  userName:string;
  displayName:string;
}

class WordPressImport {
  private _doc:XMLDocument;
  private _title:string;
  private _url:string;
  private _authors:Array<Author> = [];
  private _categories:Array<Category> = [];
  private _tags:Array<Category> = [];
  private _paths:PathCollection = {};
  private _posts:Array<Post> = [];
  private _pages:Array<Page> = [];
  private _attachments:Array<Attachment> = [];

  constructor(xmlString:string) {
    this._doc = (new DOMParser()).parseFromString(xmlString, "application/xml");
    this._title = this._doc.evaluate (WORDPRESS_PATHS.blogTitle, this._doc, null, XPathResult.STRING_TYPE, null).stringValue;
    this._url = this._doc.evaluate (WORDPRESS_PATHS.blogUrl, this._doc, null, XPathResult.STRING_TYPE, null).stringValue;
    this._getAuthors();
    this._getCategoriesTags("category");
    this._getCategoriesTags("tag");
    this._getPosts();
  }

  public get blogTitle():string {
    return this._title;
  }

  public get blogUrl():string {
    return this._url;
  }

  public get authors():Array<Author> {
    return this._authors;
  }

  public get posts():Array<Post> {
    return this._posts;
  }

  public get pages():Array<Page> {
    return this._pages;
  }

  public get attachments():Array<Attachment> {
    return this._attachments;
  }

  public get categories():Array<Category> {
    return this._categories;
  }

  public get tags():Array<Category> {
    return this._tags;
  }

  public get paths():PathCollection {
    return this._paths;
  }

  private _getAuthors() {
    var authors:Array<Author> = [];
    var results = this._doc.evaluate(WORDPRESS_PATHS.authors, this._doc, this._resolver, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
    var author = results.iterateNext();
    while(author) {
      var newAuthor:Author = {
        id: Number(author["getElementsByTagName"]("author_id")[0].innerHTML),
        email: author["getElementsByTagName"]("author_email")[0].innerHTML,
        userName: author["getElementsByTagName"]("author_login")[0].innerHTML,
        displayName: author["getElementsByTagName"]("author_display_name")[0].innerHTML.replace(/^<!\[CDATA\[|\]\]>$/g, ""),
      };
      this._authors.push(newAuthor);
      author = results.iterateNext();
    }
  }

  private _getCategoriesTags(type:string) {
    switch(type) {
      case "category":
        var items:Array<Tag> = [];
        var newItem:Tag;
        var path = WORDPRESS_PATHS.categories;
        var slug = "category_nicename";
        var name = "cat_name";
        break;
      case "tag":
        var items:Array<Category> = [];
        var newItem:Category;
        var path = WORDPRESS_PATHS.tags;
        var slug = "tag_slug";
        var name = "tag_name";
        break;        
    }
    var results = this._doc.evaluate(path, this._doc, this._resolver, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
    var item = results.iterateNext();
    while(item) {
      newItem = {
        id: Number(item["getElementsByTagName"]("term_id")[0].innerHTML),
        slug: item["getElementsByTagName"](slug)[0].innerHTML,
        displayName: item["getElementsByTagName"](name)[0].innerHTML.replace(/^<!\[CDATA\[|\]\]>$/g, ""),
        postPaths: []
      };
      items.push(newItem);
      item = results.iterateNext();
    }
    switch(type) {
      case "category":
        this._categories = items;
        break;
      case "tag":
        this._tags = items;
        break;
    }
  }

  private _getPosts() {
    var posts:Array<Post|Page|Attachment> = [];
    var item:Post|Page|Attachment;
    var results = this._doc.evaluate (WORDPRESS_PATHS.posts, this._doc, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
    var post = results.iterateNext();
    while(post) {
      var post_type = post["getElementsByTagName"]("post_type")[0].innerHTML.replace(/^<!\[CDATA\[|\]\]>$/g, "");
      switch(post_type) {
        case "attachment":
          item = {
            id: Number(post["getElementsByTagName"]("post_id")[0].innerHTML),
            parent: Number(post["getElementsByTagName"]("post_parent")[0].innerHTML),
            url: post["getElementsByTagName"]("attachment_url")[0].innerHTML,
            path: post["getElementsByTagName"]("attachment_url")[0].innerHTML.replace(this.blogUrl, ""),
          } as Attachment;
          this._attachments.push(item);
          break;

        case "post":
          item = {
            id: Number(post["getElementsByTagName"]("post_id")[0].innerHTML),
            timestamp: (new Date(post["getElementsByTagName"]("post_date")[0].innerHTML.replace(/^<!\[CDATA\[|\]\]>$/g, ""))).getTime(),
            originalUrl: post["getElementsByTagName"]("link")[0].innerHTML,
            path: post["getElementsByTagName"]("link")[0].innerHTML.replace(this.blogUrl, ""),
            status: post["getElementsByTagName"]("status")[0].innerHTML.replace(/^<!\[CDATA\[|\]\]>$/g, ""),
            title: post["getElementsByTagName"]("title")[0].innerHTML,
            author: post["getElementsByTagName"]("creator")[0].innerHTML.replace(/^<!\[CDATA\[|\]\]>$/g, ""),
            content: post["getElementsByTagName"]("encoded")[0].innerHTML.replace(/^<!\[CDATA\[|\]\]>$/g, ""),
          } as Post;
          var parent = Number(post["getElementsByTagName"]("post_parent")[0].innerHTML);
          if(parent != 0) item.parent = parent;
          this._posts.push(item);
          break;

        case "page":
          item = {
            id: Number(post["getElementsByTagName"]("post_id")[0].innerHTML),
            timestamp: (new Date(post["getElementsByTagName"]("post_date")[0].innerHTML.replace(/^<!\[CDATA\[|\]\]>$/g, ""))).getTime(),
            originalUrl: post["getElementsByTagName"]("link")[0].innerHTML,
            path: post["getElementsByTagName"]("link")[0].innerHTML.replace(this.blogUrl, ""),
            status: post["getElementsByTagName"]("status")[0].innerHTML.replace(/^<!\[CDATA\[|\]\]>$/g, ""),
            title: post["getElementsByTagName"]("title")[0].innerHTML,
            author: post["getElementsByTagName"]("creator")[0].innerHTML.replace(/^<!\[CDATA\[|\]\]>$/g, ""),
            content: post["getElementsByTagName"]("encoded")[0].innerHTML.replace(/^<!\[CDATA\[|\]\]>$/g, ""),
          } as Post;
          var parent = Number(post["getElementsByTagName"]("post_parent")[0].innerHTML);
          if(parent != 0) item.parent = parent;
          this._pages.push(item);
          break;
      }
      this._addPathItem(post_type, item);
      this._getPostTags(post);
      post = results.iterateNext();
    }
  }

  private _getPostTags(post:Node) {
    var results = post["getElementsByTagName"]("category");
    var item:Tag|Category;
    for(var x = 0; x < results.length; x++) {
      var type = results[x]["getAttribute"]("domain");
      switch(type) {
        case "post_tag":
          item = this._getTag(results[x]["innerHTML"].replace(/^<!\[CDATA\[|\]\]>$/g, ""));
          break;
        case "category":
          item = this._getCategory(results[x]["innerHTML"].replace(/^<!\[CDATA\[|\]\]>$/g, ""));
          break;
      }
      item.postPaths.push(post["getElementsByTagName"]("link")[0].innerHTML.replace(this.blogUrl, ""))
    }
  }

  private _getCategory(category:string):Category {
    for (var x = 0; x < this._categories.length; x++) {
      if(this._categories[x].displayName == category || this._categories[x].slug == category) return this._categories[x];
    }
    return null;
  }

  private _getTag(tag:string):Tag {
    for (var x = 0; x < this._tags.length; x++) {
      if(this._tags[x].displayName == tag) return this._tags[x];
    }
    return null;
  }

  private _addPathItem(type:string, item:Post|Page|Attachment) {
    if(!this._paths[item.path]) this._paths[item.path] = {
      type:type,
      item:item
    };
  }

  private _getPathItem(path:string):Path {
    if(this._paths[path]) return this._paths[path];
    return null;
  }

  public toJSON() {
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
    }
  }

  public get toString() {
    return JSON.stringify(this.toJSON(), null, 2);
  }

  private _resolver(ns:string) {
    return WORDPRESS_NAMESPACES[ns];
  }
}

class StaticApp {
  private static _reader:FileReader = new FileReader();
  private static _import:WordPressImport;

  public static init() {
    StaticApp._reader.onload = StaticApp._readFile;
  }

  public static openFile(e:any) {
    StaticApp._reader.readAsText(e.target.files[0]);    
  }

  private static _readFile() {
    StaticApp._import = new WordPressImport(StaticApp._reader.result);
    $("#import_result").html(`
      Title: ${StaticApp._import.blogTitle}<br>
      URL: ${StaticApp._import.blogUrl}<br>
      # Authors: ${StaticApp._import.authors.length}<br>
      # Categories: ${StaticApp._import.categories.length}<br>
      # Tags: ${StaticApp._import.tags.length}<br>
      # Attachments: ${StaticApp._import.attachments.length}<br>
      # Posts: ${StaticApp._import.posts.length}<br>
      # Pages: ${StaticApp._import.pages.length}<br>
    `);
  }
}
StaticApp.init();
$("#import_file").change(StaticApp.openFile);
