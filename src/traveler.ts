export class Traveler {
  public id: string | undefined;
  public name: string;
  public email: string;
  public isVip: boolean; // * 🧼 🚿 CLEAN: camelCase, flags boolean, non redundant name

  constructor(name: string, email: string, isVip = false) {
    this.name = name;
    this.email = email;
    this.isVip = isVip;
  }
}
