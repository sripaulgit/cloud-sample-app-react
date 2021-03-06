import Client from '../Client.js';
import { SortOrder } from 'kentico-cloud-delivery';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { initLanguageCodeObject, defaultLanguage } from '../Utilities/LanguageCodes';

let articleList = initLanguageCodeObject();
let articleDetails = initLanguageCodeObject();
const unsubscribe = new Subject();
let changeListeners = [];

let notifyChange = () => {
  changeListeners.forEach((listener) => {
    listener();
  });
}

class ArticleStore {

  // Actions

  provideArticle(articleId, language) {

    let query = Client.items()
      .type('article')
      .equalsFilter('system.id', articleId)
      .elementsParameter(['title', 'teaser_image', 'post_date', 'body_copy', 'video_host', 'video_id', 'tweet_link', 'theme', 'display_options']);

    if (language) {
      query.languageParameter(language);
    }

    query.getObservable()
      .pipe(takeUntil(unsubscribe))
      .subscribe(response => {
        if (!response.isEmpty) {
          if (language) {
            articleDetails[language][articleId] = response.items[0];
          } else {
            articleDetails[defaultLanguage][articleId] = response.items[0];
          }
          notifyChange();
        }
      })
  }

  provideArticles(count, language) {

    let query = Client.items()
      .type('article')
      .orderParameter("elements.post_date", SortOrder.desc);

    if (language) {
      query.languageParameter(language);
    }

    query.getObservable()
      .pipe(takeUntil(unsubscribe))
      .subscribe(response => {
        if (language) {
          articleList[language] = response.items;
        } else {
          articleList[defaultLanguage] = response.items
        }
        notifyChange();
      });
  }

  // Methods
  getArticle(articleId, language) {
    if (language) {
      return articleDetails[language][articleId];
    } else {
      return articleDetails[defaultLanguage][articleId];
    }

  }

  getArticles(count, language) {
    if (language) {
      return articleList[language].slice(0, count);
    }
    else {
      return articleList[defaultLanguage].slice(0, count);
    }
  }

  // Listeners
  addChangeListener(listener) {
    changeListeners.push(listener);
  }

  removeChangeListener(listener) {
    changeListeners = changeListeners.filter((element) => {
      return element !== listener;
    });
  }

  unsubscribe() {
    unsubscribe.next();
    unsubscribe.complete();
  }

}

export default new ArticleStore();