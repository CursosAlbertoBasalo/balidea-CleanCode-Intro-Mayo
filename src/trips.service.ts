/* eslint-disable max-lines-per-function */
/* eslint-disable max-depth */
/* eslint-disable max-statements */
import { Booking, BookingStatus } from "./booking";
import { DataBase } from "./data_base";
import { SmtpService } from "./smtp.service";
import { Traveler } from "./traveler";
import { Trip, TripStatus } from "./trip";

export class TripsService {
  public cancelTrip(tripId: string) {
    // ToDo: 💩 🤢 several abstraction levels
    // ToDo: 💩 🤢 nested structures

    const trip: Trip = DataBase.selectOne<Trip>(`SELECT * FROM trips WHERE id = '${tripId}'`);
    trip.status = TripStatus.CANCELLED;
    DataBase.update(trip);
    const bookings: Booking[] = DataBase.select("SELECT * FROM bookings WHERE trip_id = " + tripId);
    if (bookings.length > 0) {
      const smtp = new SmtpService();
      for (const booking of bookings) {
        booking.status = BookingStatus.CANCELLED;
        DataBase.update(booking);
        const traveler = DataBase.selectOne<Traveler>(`SELECT * FROM travelers WHERE id = '${booking.travelerId}'`);
        if (traveler) {
          smtp.sendMail(
            "trips@astrobookings.com",
            traveler.email,
            "Trip cancelled",
            `Sorry, your trip ${trip.destination} has been cancelled.`,
          );
        }
      }
    }
  }
}
