const WORDPRESS_PATHS = {
  blogTitle: '/rss/channel/title',
  blogUrl: '/rss/channel/link',
  posts: '/rss/channel/item',
  categories: '/rss/channel/wp:category',
  tags: '/rss/channel/wp:tag',
  authors: '/rss/channel/wp:author'
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
}

interface Tag {
  id:number;
  slug:string;
  displayName:string;
}

interface Post {
  id:number;
  parent:number;
  postTime:number;
  originalUrl:string;
  path:string;
  type:string;
  status:string;
  title:string;
  content:string;
}

interface Author {
  id:number;
  email:string;
  userName:string;
  displayName:string;
}

class WordPressImport {
  private _doc:XMLDocument;

  constructor(xmlString:string) {
    this._doc = (new DOMParser()).parseFromString(xmlString, "application/xml");
  }

  public get blogTitle():string {
    return this._doc.evaluate (WORDPRESS_PATHS.blogTitle, this._doc, null, XPathResult.STRING_TYPE, null).stringValue;
  }

  public get blogUrl():string {
    return this._doc.evaluate (WORDPRESS_PATHS.blogUrl, this._doc, null, XPathResult.STRING_TYPE, null).stringValue;
  }

  public get posts():Array<Post> {
    var posts:Array<Post> = [];
    var results = this._doc.evaluate (WORDPRESS_PATHS.posts, this._doc, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
    var post = results.iterateNext();
    while(post) {
      posts.push({
        id: Number(post["getElementsByTagName"]("post_id")[0].innerHTML),
        parent: Number(post["getElementsByTagName"]("post_parent")[0].innerHTML),
        postTime: (new Date(post["getElementsByTagName"]("post_date")[0].innerHTML)).getTime(),
        originalUrl: post["getElementsByTagName"]("link")[0].innerHTML,
        path: post["getElementsByTagName"]("link")[0].innerHTML.replace(this.blogUrl, ""),
        type: post["getElementsByTagName"]("post_type")[0].innerHTML,
        status: post["getElementsByTagName"]("status")[0].innerHTML,
        title: post["getElementsByTagName"]("title")[0].innerHTML,
        content: post["getElementsByTagName"]("encoded")[0].innerHTML.replace(/^<!\[CDATA\[|\]\]>$/g, ""),
      });
      post = results.iterateNext();
    }
    return posts;
  }

  public get authors():Array<Author> {
    var authors:Array<Author> = [];
    var results = this._doc.evaluate(WORDPRESS_PATHS.authors, this._doc, this._resolver, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
    var author = results.iterateNext();
    while(author) {
      authors.push({
        id: Number(author["getElementsByTagName"]("author_id")[0].innerHTML),
        email: author["getElementsByTagName"]("author_email")[0].innerHTML,
        userName: author["getElementsByTagName"]("author_login")[0].innerHTML,
        displayName: author["getElementsByTagName"]("author_display_name")[0].innerHTML.replace(/^<!\[CDATA\[|\]\]>$/g, ""),
      });
      author = results.iterateNext();
    }
    return authors;
  }

  public get categories():Array<Category> {
    return this._categoriesTags("category");
  }

  public get tags():Array<Category> {
    return this._categoriesTags("tag");
  }

  private _categoriesTags(type:string):Array<Category|Tag> {
    switch(type) {
      case "category":
        var items:Array<Tag> = [];
        var path = WORDPRESS_PATHS.categories;
        var slug = "category_nicename";
        var name = "cat_name";
        break;
      case "tag":
        var items:Array<Category> = [];
        var path = WORDPRESS_PATHS.tags;
        var slug = "tag_slug";
        var name = "tag_name";
        break;        
    }
    var results = this._doc.evaluate(path, this._doc, this._resolver, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
    var item = results.iterateNext();
    while(item) {
      items.push({
        id: Number(item["getElementsByTagName"]("term_id")[0].innerHTML),
        slug: item["getElementsByTagName"](slug)[0].innerHTML,
        displayName: item["getElementsByTagName"](name)[0].innerHTML.replace(/^<!\[CDATA\[|\]\]>$/g, ""),
      });
      item = results.iterateNext();
    }
    return items;
  }

  public toJSON() {
    return {
      blogTitle: this.blogTitle,
      blogUrl: this.blogUrl,
      authors: this.authors,
      categories: this.categories,
      tags: this.tags,
      posts: this.posts,
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

    // var str = xml2json(doc);
    // var data = JSON.parse(str.replace(/^{\sundefined/, "{"));
    document.write('<pre>DONE\n');
//        document.write(data);
    document.write('</pre>');
  }
}
StaticApp.init();

$("#import_file").change(StaticApp.openFile);
