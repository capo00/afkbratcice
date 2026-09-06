import { Dao } from "caio-server";

class ArticleDao extends Dao {
  constructor() {
    super("article");
  }

  createIndexes() {
    return Promise.all([
      // Pořadí polí sedí na výpis novinek: rovnost na `state`, pak řazení podle
      // `priority` a `publishTime` -- Mongo umí index použít i na sort, ne jen na filtr.
      super.createIndex({ state: 1, priority: -1, publishTime: -1 }),
      super.createIndex({ publishTime: -1 }),
      super.createIndex({ matchId: 1 }, { sparse: true }),
      super.createIndex({ tagList: 1 }, { sparse: true }),
    ]);
  }

  /**
   * Výpis novinek. Vrací `pageInfo` včetně `total` -- novinky jsou první seznam v appce,
   * který se reálně stránkuje, takže klient potřebuje vědět, jestli je co načítat dál
   * (viz `Dao.findPage()` v caio-server).
   *
   * `sectionList` se **nevrací**: výpis potřebuje perex, ne celé texty. U dvaceti článků
   * by to byl řádově větší přenos zadarmo.
   *
   * Výchozí řazení je `priority` DESC, `publishTime` DESC -- připnutá novinka drží špičku
   * výpisu bez ohledu na datum. RSS si přes `sort` řekne o čistě chronologické: připínání
   * je vlastnost webu, čtečka čeká, že nahoře je to nejnovější.
   */
  listPageByFilter(
    { state, matchId, tag, publishedBefore } = {},
    pageInfo,
    { withContent = false, sort = { priority: -1, publishTime: -1 } } = {},
  ) {
    const filter = {};
    if (state) filter.state = state;
    if (matchId) filter.matchId = matchId;
    if (tag) filter.tagList = tag;
    // Naplánovaná novinka se zveřejní sama tím, že čas dojde -- redakce nemusí nic
    // překlikávat. Pro přihlášenou redakci se filtr nenasazuje, ta vidí i budoucí.
    if (publishedBefore) filter.publishTime = { $lte: publishedBefore };

    return this.findPage(filter, pageInfo, sort, withContent ? {} : { sectionList: 0 });
  }
}

export default new ArticleDao();
