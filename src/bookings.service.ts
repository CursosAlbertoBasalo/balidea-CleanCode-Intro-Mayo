import { Booking, BookingStatus } from "./booking";
import { DataBase } from "./data_base";
import { Traveler } from "./traveler";
import { Trip } from "./trip";
// * 🧼 🚿  CLEAN:  PascalCase, expressive and easy distinguible (also on file)
export class BookingsService {
  private booking!: Booking;
  private trip!: Trip; // * 🧼 🚿 CLEAN: consistent naming

  /**
   * Requests a new booking
   * @param {string} travelerId - the id of the traveler soliciting the booking
   * @param {string} tripId - the id of the trip to book
   * @param {number} passengersCount - the number of passengers to reserve
   * @param {string} cardNumber - the card number to pay with
   * @param {string} cardExpiry - the card expiry date
   * @param {string} cardCvc - the card CVC
   * @param {boolean} hasPremiumFoods - if the traveler has premium foods
   * @param {number} extraLuggageKilos - the number of extra luggage kilos
   * @returns {Booking} the new booking object
   * @throws {Error} if the booking is not possible
   */
  public request(
    travelerId: string,
    tripId: string, // * 🧼 🚿 CLEAN: camelCase
    passengersCount: number, // * 🧼 🚿 CLEAN: distinction between a list and a value
    cardNumber: string,
    cardExpiry: string, // * 🧼 🚿 CLEAN: coherent name
    cardCvc: string, // * 🧼 🚿 CLEAN: uppercase consistency
    hasPremiumFoods: boolean, // * 🧼 🚿 CLEAN: boolean flags
    extraLuggageKilos: number,
  ): Booking {
    this.create(travelerId, tripId, passengersCount, hasPremiumFoods, extraLuggageKilos);
    // * 🧼 🚿 CLEAN: remove empty line
    this.save();
    this.pay(cardNumber, cardExpiry, cardCvc);
    return this.booking;
  }
  // * 🧼 🚿 CLEAN: clear intention, non redundant name, no comment
  private create(
    travelerId: string,
    tripId: string,
    passengersCount: number,
    hasPremiumFoods: boolean,
    extraLuggageKilos: number,
  ): void {
    passengersCount = this.getValidatedPassengersCount(travelerId, passengersCount);
    this.checkAvailability(tripId, passengersCount);
    this.booking = new Booking(tripId, travelerId, passengersCount);
    this.booking.hasPremiumFoods = hasPremiumFoods;
    this.booking.extraLuggageKilos = extraLuggageKilos;
  }
  // * 🧼 🚿 CLEAN: start with get and express the intention and use consistent naming for parameters
  private getValidatedPassengersCount(travelerId: string, passengersCount: number) {
    const maxPassengersCount = 6; // * 🧼 🚿 CLEAN: remove magic number
    if (passengersCount > maxPassengersCount) {
      throw new Error(`Nobody can't have more than ${maxPassengersCount} passengers`);
    }
    // * 🧼 🚿 CLEAN: remove comments by using clear names
    const maxNonVipPassengersCount = 4; // * 🧼 🚿 CLEAN: remove magic number
    if (this.isNonVip(travelerId) && passengersCount > maxNonVipPassengersCount) {
      throw new Error(`No VIPs cant't have more than ${maxNonVipPassengersCount} passengers`);
    }
    if (passengersCount <= 0) {
      passengersCount = 1;
    }
    return passengersCount;
  }
  // * 🧼 🚿 CLEAN: boolean verbs should start with flags
  private isNonVip(travelerId: string): boolean {
    const theTraveler = DataBase.selectOne<Traveler>(`SELECT * FROM travelers WHERE id = '${travelerId}'`);
    return theTraveler.isVip;
  }

  private checkAvailability(tripId: string, passengersCount: number) {
    this.trip = DataBase.selectOne<Trip>(`SELECT * FROM trips WHERE id = '${tripId}'`);
    // * 🧼 🚿 CLEAN: flags should start with flag verbs
    const hasAvailableSeats = this.trip.availablePlaces >= passengersCount;
    if (!hasAvailableSeats) {
      throw new Error("There are no seats available in the trip");
    }
  }
  // * 🧼 🚿 CLEAN: remove redundant comments and words
  private save() {
    this.booking.id = DataBase.insert<Booking>(this.booking);
  }
  private pay(cardNumber: string, cardExpiry: string, cardCVC: string) {
    this.booking.price = this.calculatePrice();
    // To Do: Call a Payment gateway to pay with card info
    console.log(`Paying ${this.booking.price} with ${cardNumber} and ${cardExpiry} and ${cardCVC}`);
    this.booking.paymentId = "payment fake identification";
    this.booking.status = BookingStatus.PAID;
    DataBase.update(this.booking);
  }
  // * 🧼 🚿 CLEAN: use verbs to clarify intention
  private calculatePrice(): number {
    // * 🧼 🚿 CLEAN: remove magic number
    const millisecondsPerSecond = 1000;
    const secondsPerMinute = 60;
    const minutesPerHour = 60;
    const hoursPerDay = 24;
    // * 🧼 🚿 CLEAN: use a consistent name pattern
    const millisecondsPerDay = millisecondsPerSecond * secondsPerMinute * minutesPerHour * hoursPerDay;
    const stayingNights = Math.round(this.trip.endDate.getTime() - this.trip.startDate.getTime() / millisecondsPerDay);
    // Calculate staying price
    const stayingPrice = stayingNights * this.trip.stayingNightPrice;
    // Calculate flight price
    const flightPrice = this.trip.flightPrice + (this.booking.hasPremiumFoods ? this.trip.premiumFoodPrice : 0);
    const passengerPrice = flightPrice + stayingPrice;
    const passengersPrice = passengerPrice * this.booking.passengersCount;
    // Calculate luggage price for all passengers of the booking
    const extraTripPrice = this.booking.extraLuggageKilos * this.trip.extraLuggagePricePerKilo;
    return passengersPrice + extraTripPrice;
  }
}