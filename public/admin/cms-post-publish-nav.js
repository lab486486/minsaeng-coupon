/**
 * After Decap publish, jump back to the collection list.
 * 새 글쓰기(posts_new) 발행 후에는 기존 글 목록(posts)으로 이동.
 */
(function () {
  var LIST_ALIASES = {
    posts_new: "posts",
  };

  function goToCollectionList(collection) {
    if (!collection) return;
    var targetName = LIST_ALIASES[collection] || collection;
    var target = "#/collections/" + targetName;
    window.setTimeout(function () {
      if (location.hash !== target) {
        location.hash = target;
      }
    }, 400);
  }

  function register() {
    if (!window.CMS || typeof window.CMS.registerEventListener !== "function") {
      window.setTimeout(register, 50);
      return;
    }

    window.CMS.registerEventListener({
      name: "postPublish",
      handler: function (data) {
        try {
          var entry = data && data.entry;
          var collection =
            entry && typeof entry.get === "function" ? entry.get("collection") : "";
          goToCollectionList(collection);
        } catch (e) {
          /* ignore */
        }
      },
    });
  }

  register();
})();
