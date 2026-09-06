import { Crud, Error as CoreError, BinaryStore } from "caio-server";
import dao from "./dao.js";
import matchDao from "../match/dao.js";
import Config from "../config.js";
import { hasRole } from "../services/authorize.js";

/**
 * Novinka. Obsah je `sectionList` -- pole objektů sekcí, zatím s jediným klíčem `content`
 * (`uu5String`). Objekt, ne holý string: nadpis sekce, kotva nebo varianta podkladu se pak
 * přidají bez migrace, a `sectionList` je přesně jednotka, se kterou pracuje ECC, takže
 * pozdější přechod je rozpad pole na dokumenty (design/api.md, 2.8).
 *
 * Titulní foto leží v kolekci `article` BinaryStore a článek si drží denormalizované
 * `photographUri` -- stejný postup jako logo u týmu, včetně úklidu binárky, když zápis
 * do Monga selže.
 */
class ArticleCrud extends Crud {
  constructor() {
    super("article", dao);
  }

  /** Redakce vidí i rozpracované a naplánované; kdokoli jiný jen to, co je venku. */
  _isEditor(identity) {
    return hasRole(identity, Config.NEWS);
  }

  async list({ state, matchId, tag, pageInfo } = {}, identity) {
    const editor = this._isEditor(identity);
    const result = await dao.listPageByFilter(
      {
        state: editor ? state : "published",
        matchId,
        tag,
        // Naplánovaná novinka se zveřejní sama tím, že čas dojde. Filtr je jen pro
        // veřejnost -- redakce musí svůj naplánovaný článek najít, aby ho mohla upravit.
        publishedBefore: editor ? undefined : new Date().toISOString(),
      },
      pageInfo,
    );

    return { ...result, itemList: result.itemList.map((item) => this._getData(item)) };
  }

  async get(id, identity) {
    const article = this._getData(await this._get(id));

    // Nepublikovaný článek nemá mít veřejný odkaz. 404, ne 403: existence rozpracované
    // novinky je sama o sobě informace.
    if (!this._isEditor(identity) && !this._isPublic(article)) {
      throw new CoreError("Article does not exist", {
        status: 404,
        code: `${Config.ERROR_PREFIX}/article/notFound`,
        paramMap: { id },
      });
    }

    // Report ze zápasu ukazuje výsledek v hlavičce, takže zápas dotahujeme rovnou --
    // jinak by si ho klient musel vyžádat druhým dotazem na každém detailu.
    const match = article.matchId ? await matchDao.get(article.matchId).catch(() => null) : null;
    return { ...article, match };
  }

  async create(data, identity) {
    const { photograph, ...rest } = data;
    const binary = photograph ? await this._createPhotograph(photograph, rest.name) : null;

    try {
      return await super.create({
        priority: 0,
        state: "draft",
        publishTime: new Date().toISOString(),
        // Podpis je volný text (může to být "Redakce" i host), ale výchozí je jméno
        // z identity -- ať to autor nemusí vypisovat u každého článku.
        author: identity?.name ?? null,
        ...this._normalize(rest),
        authorIdentity: identity?.identity ?? null,
        photographId: binary?.id ?? null,
        photographUri: binary?.uri ?? null,
      });
    } catch (e) {
      if (binary) await this._deleteBinary(binary.id);
      throw e;
    }
  }

  async update(data) {
    const { photograph, ...rest } = data;
    const current = await this._get(data.id);
    const normalized = this._normalize(rest);

    // `photograph: null` = smazat, File = nahradit, undefined = nechat být.
    if (photograph === null) {
      if (current.photographId) await this._deleteBinary(current.photographId);
      return super.update({ ...normalized, photographId: null, photographUri: null });
    }

    if (!photograph) return super.update(normalized);

    const binary = await this._createPhotograph(photograph, normalized.name ?? current.name);

    let updated;
    try {
      // photographUri se MUSÍ přepsat: každá nová binárka má jiné uri, jinak by zůstalo
      // viset staré a obrázek by se rozbil.
      updated = await super.update({ ...normalized, photographId: binary.id, photographUri: binary.uri });
    } catch (e) {
      await this._deleteBinary(binary.id);
      throw e;
    }

    if (current.photographId) await this._deleteBinary(current.photographId);
    return updated;
  }

  /**
   * Vlastní use case, ne `update` s jedním polem: publikace je nejčastější a nejcitlivější
   * úkon redakce a v administraci je to jedno tlačítko, ne formulář.
   */
  async setState({ id, state }) {
    return super.update({ id, state });
  }

  async delete(id) {
    const current = await this._get(id);
    await super.delete(id);
    if (current?.photographId) await this._deleteBinary(current.photographId);
  }

  _isPublic(article) {
    return article.state === "published" && (!article.publishTime || article.publishTime <= new Date().toISOString());
  }

  /**
   * Sekce se ukládají jako celek, ne po jedné. Prázdná sekce se zahazuje -- vzniká
   * kliknutím na "přidat sekci" a odchodem z formuláře, ne úmyslem.
   */
  _normalize(data) {
    if (!Array.isArray(data.sectionList)) return data;
    return {
      ...data,
      sectionList: data.sectionList
        .map((section) => ({ ...section, content: section?.content ?? "" }))
        .filter((section) => section.content.trim() !== ""),
    };
  }

  _createPhotograph(file, name) {
    return BinaryStore.Binary.create({
      file,
      name,
      collection: Config.BINARY_COLLECTION.ARTICLE,
      type: Config.BINARY_TYPE.PHOTO,
    });
  }

  /** Úklid binárky nesmí shodit operaci, která už v databázi proběhla. */
  async _deleteBinary(id) {
    try {
      await BinaryStore.Binary.delete(id);
    } catch (e) {
      console.error("[article] photograph binary cannot be deleted", id, e?.message ?? e);
    }
  }
}

export default new ArticleCrud();
