const NAMES = {
  woman: "Žena",
  man: "Muž",
  child: "Dítě",
};

const HAIR_TYPES = {
  child: { short: "Krátké", long: "Dlouhé" },
  woman: { short: "Krátké", middle: "Střední", long: "Dlouhé" },
};

const QUANTITIES = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8];

export class Service {
  constructor(key, attrs, hairType) {
    this.key = key;
    this.price = typeof attrs.price === "object" ? attrs.price[hairType] : (attrs.price || 0);
    this.name = attrs.name;

    if (attrs.unit) {
      this.unit = attrs.unit.volume;
      this.unitPrice = attrs.unit.price;
    }
  }

  getQuantityItemList() {
    return QUANTITIES.map((qty) => ({ key: qty, name: qty.toString().replace(".", ",") }));
  }

  setQuantity(quantity) {
    this.quantity = quantity || undefined;
    return this;
  }

  getQuantity() {
    return this.quantity;
  }

  getTotal() {
    let total = this.price;
    if (this.quantity) total += this.quantity * this.unitPrice;
    return total;
  }
}

export default class Order {
  constructor(config) {
    this.config = config;

    this.product = null;
    this.category = null;
    this.hairType = null;
    this.services = [];
    this.eyelashKey = null;
    this.eventKeys = [];

    this.customer = null;
    this.note = null;

    this.brideType = null;
    this.guests = null;
    this.weddingDate = null;
    this.deposit = 0;
    this.note = null;
    this.id = null;
    this.total = null;
  }

  setProduct(product) { this.product = product; return this; }
  getProduct() { return this.product; }

  setCategory(category) { this.category = category; return this; }
  getCategory() { return this.category; }

  setHairType(type) { this.hairType = type; return this; }
  getHairType() { return this.hairType; }
  getHairTypeName() { return HAIR_TYPES[this.category]?.[this.hairType]; }

  getHairTypeItemList() { return Object.entries(HAIR_TYPES[this.category]).map(([key, name]) => ({ key, name })); }

  getCategoryItemList() {
    const hair = this.config.hair;
    if (!hair) return [];
    return ["woman", "child", "man"].map((key) => ({ key, name: hair[key].name }));
  }

  getServiceItems() {
    const hair = this.config.hair;
    if (!hair || !this.category) return {};
    const { name, ...services } = hair[this.category];
    return services || {};
  }

  addService(serviceKey) {
    const attrs = this.config.hair[this.category][serviceKey];
    const service = new Service(serviceKey, attrs, this.hairType);
    this.services.push(service);
    return this;
  }

  removeService(serviceKey) {
    const index = this.services.findIndex((s) => s.key === serviceKey);
    if (index > -1) {
      const removed = this.services[index];
      this.services.splice(index, 1);
      return removed;
    }
    return null;
  }

  clearServices() { this.services.length = 0; return this; }
  getService(key) { return this.services.find((s) => s.key === key); }
  hasService(key) { return !!this.getService(key); }

  setEyelash(key) { this.eyelashKey = key; return this; }
  getEyelash() { return this.eyelashKey; }
  getEyelashName() { return this.eyelashKey ? this.config.eyelash?.[this.eyelashKey]?.name : ""; }
  getEyelashPrice() { return this.eyelashKey ? this.config.eyelash?.[this.eyelashKey]?.price : 0; }

  getEyelashItemList() {
    const { type, id, sys, name, ...items } = this.config.eyelash || {};
    return Object.entries(items).map(([key, v]) => ({ key, name: v.name }));
  }

  toggleEvent(key) {
    const i = this.eventKeys.indexOf(key);
    if (i > -1) this.eventKeys.splice(i, 1);
    else this.eventKeys.push(key);
    return this;
  }
  getEventKeys() { return this.eventKeys; }

  getEventItems() {
    const { type, id, sys, name, ...items } = this.config.event || {};
    return Object.fromEntries(Object.entries(items).map(([k, v]) => [k, v.name]));
  }

  setBrideType(type) { this.brideType = type; return this; }
  getBrideType() { return this.brideType; }
  setGuests(guests) { this.guests = guests; return this; }
  getGuests() { return this.guests; }
  setWeddingDate(date) { this.weddingDate = date; return this; }
  getWeddingDate() { return this.weddingDate; }
  setDeposit(deposit) { this.deposit = deposit; }
  getDeposit() { return this.deposit; }
  setNote(text) { this.note = text; }
  getNote() { return this.note; }
  setCustomer(customer) { this.customer = customer; }
  getCustomer() { return this.customer; }
  setNote(note) { this.note = note; }
  getNote() { return this.note; }

  getTitle() {
    if (this.category) {
      let title = NAMES[this.category];
      const hairName = this.getHairTypeName();
      if (hairName) title += ` - ${hairName.toLowerCase()} vlasy`;
      return title;
    }
    if (this.eyelashKey) return `Řasy - ${this.getEyelashName()}`;
    if (this.brideType || this.guests) return "Svatba";
    if (this.eventKeys.length) return "Společenská akce";
    return "";
  }

  listDisplayServices() {
    const list = [];

    if (this.services.length) {
      this.services.forEach((s) => {
        list.push({ key: s.key, name: s.name, price: s.getTotal() });
      });
    }

    if (this.eyelashKey) {
      list.push({ key: "eyelash", name: `Řasy - ${this.getEyelashName().toLowerCase()}`, price: this.getEyelashPrice() });
    }

    if (this.eventKeys.length) {
      this.eventKeys.forEach((key) => {
        const item = this.config.event[key];
        list.push({ key: `event-${key}`, name: item.name, price: item.price });
      });
    }

    if (this.brideType) {
      const bride = this.config.wedding.bride[this.brideType];
      list.push({ key: "bride", name: `Nevěsta - ${bride.name.toLowerCase()}`, price: bride.price });
    }

    if (this.guests) {
      const agg = {};
      this.guests.forEach((guestItems) => {
        guestItems.forEach((key) => { agg[key] = (agg[key] || 0) + 1; });
      });
      Object.entries(agg).forEach(([key, count]) => {
        const g = this.config.wedding.guest[key];
        list.push({ key: `guest-${key}`, name: `Host - ${g.name.toLowerCase()} (${count}x)`, price: g.price * count });
      });
    }

    return list;
  }

  getSubtotal() {
    return this.listDisplayServices().reduce((sum, s) => sum + s.price, 0);
  }

  setTotal(total) {
    this.total = total;
    return this;
  }

  getTotal() {
    return this.total ?? this.getSubtotal();
  }

  buildDtoIn() {
    const dtoIn = {
      product: this.product,
      customerId: this.customer?.id,
      customerName: this.customer?.name || (typeof this.customer === "string" ? this.customer : undefined),
      note: this.note ?? undefined,
      subtotal: this.getSubtotal(),
      total: this.getTotal(),
    };

    if (this.product === "hair") {
      const services = {};
      this.services.forEach((s) => {
        if (s.quantity) {
          services[s.key] = {
            quantity: s.quantity,
            unit: s.unit,
            materialPrice: s.quantity * s.unitPrice,
            workPrice: s.price,
          };
        } else {
          services[s.key] = s.price;
        }
      });
      dtoIn.hair = {
        category: this.category ?? undefined,
        type: (this.hairType !== "_" && this.hairType) || undefined,
        services: Object.keys(services).length > 0 ? services : undefined,
      };
    }

    if (this.product === "eyelash") {
      dtoIn.eyelash = { [this.eyelashKey]: this.getEyelashPrice() };
    }

    if (this.product === "event") {
      const event = {};
      this.eventKeys.forEach((key) => { event[key] = this.config.event[key].price; });
      dtoIn.event = event;
    }

    if (this.product === "wedding") {
      dtoIn.wedding = {};
      if (this.weddingDate) dtoIn.wedding.time = this.weddingDate;
      if (this.brideType) {
        dtoIn.wedding.bride = { [this.brideType]: this.config.wedding.bride[this.brideType].price };
      }
      if (this.guests) {
        dtoIn.wedding.guestList = this.guests.map((items) => {
          const g = {};
          items.forEach((key) => { g[key] = this.config.wedding.guest[key].price; });
          return g;
        }).filter((g) => Object.keys(g).length > 0);
      }
      if (this.deposit) dtoIn.wedding.deposit = this.deposit;
      if (this.note) dtoIn.note = this.note;
    }

    return dtoIn;
  }

  reset(config) {
    return new Order(config || Object.values(this.config));
  }
}
