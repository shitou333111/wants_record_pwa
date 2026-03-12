const DEFAULT_WEB_URL = "https://cloudbase-5g2jjbxw4b2bbf74-1410945126.tcloudbaseapp.com/releasing_app_dist/";

Page({
  data: {
    webUrl: DEFAULT_WEB_URL
  },
  onLoad(query) {
    // Optional override for testing:
    // /pages/index/index?url=https%3A%2F%2Fexample.com
    if (query && query.url) {
      const decoded = decodeURIComponent(query.url);
      if (decoded.startsWith("https://")) {
        this.setData({ webUrl: decoded });
      }
    }
  }
});
