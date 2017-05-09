var xml2json:(input:any) => any;

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
  postTime:number;
  originalUrl:string;
  path:string;
  type:string;
  title:string;
  content:string;
  excerpt:string;
}

const WORDPRESS_PATHS = {
  blogTitle: '/rss/channel/title',
  blogUrl: '/rss/channel/link',
  posts: '/rss/channel/item',
  categories: '/rss/channel/wp:category',
  tags: '/rss/channel/wp:tag'
}

const WORDPRESS_NAMESPACES = {
	excerpt: "http://wordpress.org/export/1.2/excerpt/",
	content: "http://purl.org/rss/1.0/modules/content/",
	wfw: "http://wellformedweb.org/CommentAPI/",
	dc: "http://purl.org/dc/elements/1.1/",
	wp: "http://wordpress.org/export/1.2/"  
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
    var results = this._doc.evaluate (path, this._doc, this._resolver, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
    var item = results.iterateNext();
    while(item) {
      items.push({
        id: Number(item["getElementsByTagName"]("term_id")[0].innerHTML),
        slug: item["getElementsByTagName"](slug)[0].innerHTML,
        displayName: item["getElementsByTagName"](name)[0].innerHTML.replace(/^<!\[CDATA\[|\]\]>$/g, "")
      });
      item = results.iterateNext();
    }
    return items;
  }

  public toJSON() {
    return {
      blogTitle: this.blogTitle,
      blogUrl: this.blogUrl,
      posts: this.posts,
      categories: this.categories,
      tags: this.tags
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
