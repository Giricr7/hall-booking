const router = require('express').Router();
const joi = require('joi');

const createRoom = [], bookedRooms = [];

//joi validation while creating a room
const createRoomSchema = joi.object({
    seatsAvailable: joi.number().required(),
    amenities: joi.array().items(joi.string().required()).required(),
    oneHourPrice: joi.number().required(),
    roomName: joi.string().required(),
})

const checkRoomName = (name) => {
   
    let filteredRoomArr=createRoom.filter((room) => {
        return room.roomName === name;
    })
  
    if (filteredRoomArr.length !=0) {
        return true
    } else {
        return false
    }
}

//joi validation while booking a room
let bookRoomSchema = joi.object({
    customerName: joi.string().required(),
    date: joi.date().required(),
    startTime: joi.string().required(),
    endTime: joi.string().required(),
    roomId:joi.string().required()
})


//split the time string into hrs,mins and session
let convertTimings = (time) => {
        let TimeArr = time.split(' ');
        let hrsAndMinsArr = TimeArr[0].split(':');
        let hrs = +hrsAndMinsArr[0];
        let mins = +hrsAndMinsArr[1];
    let session = TimeArr[1];
   
    return {hours:hrs,minutes:mins,session:session}
}

let checkTimings = (bookedRoom, date, startTime, endTime) => {
  
    //startTimearray
    let startTimeOfBookedRoom = bookedRoom.map((room) => {
        
        let date = room.date;
        let { hours,minutes,session } = convertTimings(room.startTime);
        if (session === 'PM') {
            hours = hours + 12;
        }
        let startTimeInMilliSeconds = new Date(date).setHours(hours, minutes);
       
        return (startTimeInMilliSeconds);
        
    
})

    //endTimeArray

    let endTimeOfBookedRoom = bookedRoom.map((room) => {
        
        let date = room.date;
        let { hours,minutes,session } = convertTimings(room.endTime);
        if (session === 'PM') {
            hours = hours + 12;
        }
        let endTimeInMilliSeconds = new Date(date).setHours(hours, minutes);
       
        return (endTimeInMilliSeconds);
        
    
})
    
    //currentBookingTime
let currentTimeConvert = (date,startTime) => {
        
    let { hours,minutes,session } = convertTimings(startTime);
    if (session === 'PM') {
        hours = hours + 12;
    }
    let currentTimeInMilliSeconds = new Date(date).setHours(hours, minutes);
   
    return (currentTimeInMilliSeconds);
    

    }
    
    let currentBookingStartTime = currentTimeConvert(date, startTime);
    let currentBookingEndTime = currentTimeConvert(date, endTime);
    let timeSlotStatus = true
    for (i = 0; i < startTimeOfBookedRoom.length;i++){
        if ((currentBookingStartTime >= startTimeOfBookedRoom[i] &&
            currentBookingStartTime <= endTimeOfBookedRoom[i]) ||
            (currentBookingEndTime >= startTimeOfBookedRoom[i] &&
            currentBookingEndTime <= endTimeOfBookedRoom[i]))
        {
            timeSlotStatus = false;
            break;
        } 
    }
    return timeSlotStatus;
}

//checking for room availablility at the selected time slot
let checkRoomAvailability = (date, startTime, endTime,roomId) => {
    [time, startSession] = startTime.split(' ');
    [time, endSession] = endTime.split(' ');
    if (startSession === "PM" && endSession === "AM") {
        return "invalid"
    } else {
        let bookingStatus = bookedRooms.filter(Room => { return Room.roomId === roomId })

        if (bookingStatus.length > 0) {
            let bookedRoom = bookingStatus;
            let timingCheckResult = checkTimings(bookedRoom, date, startTime, endTime);
            if (timingCheckResult === false) {
                return false;
            } else {
                return true;
            }
        } else {
            return true;
        }
    }
}


try {
    
    
//api call for room creation
    router.post('/createroom', (req, res) => {
        const { error } = createRoomSchema.validate(req.body);
        let validation = checkRoomName(req.body.roomName)
    if (error) {
        res.send(error.details[0].message)
    } else if (validation)
    {
        res.send('Duplicate Entry for Room Name')
    }else {
        req.body.bookedStatus=false
        createRoom.push(req.body);
        res.send(createRoom)
    }
    })
    

   
// api call for booking a room
    router.post('/bookroom', (req, res) => {
        if (createRoom.length < 1) {
            res.send('no rooms available for booking')
        } else {
            const { error } = bookRoomSchema.validate(req.body);
            const { date, startTime, endTime, roomId } = req.body;
            const timingResult = checkRoomAvailability(date, startTime, endTime, roomId);
            if (error) {
                res.send(error.details[0].message);
            } else if (timingResult === 'invalid') {
                res.send("Booking not allowed at the selected time slot")
            }else if (timingResult === true) {
                bookedRooms.push(req.body);
                selectedRoomIndex = createRoom.findIndex(room => room.roomName === roomId);
                createRoom[selectedRoomIndex].bookedStatus = true;
                res.send(bookedRooms);
              
            } else {
                res.send("booked slot is unavailable, please book a different time slot")
            }
        }

    })

//api call for listing all rooms with booked data 
    router.get('/listAllRooms', (req, res) => {
        let nameAndStatus = createRoom.map(({bookedStatus,roomName}) => {
            return {"BookedStatus":bookedStatus,"RoomName":roomName}
        })

        let result = nameAndStatus.map((room) => {
           let filteredDetials = bookedRooms.filter((details) => {
               return details.roomId === room.RoomName
           })
            return {RoomName:room.RoomName,BookedStatus:room.BookedStatus,BookingDetails:filteredDetials}
        })

        res.send(result)


    })

//api call for listing all customers with booked data
    router.get("/listallcustomers", (req, res) => {
        res.send(bookedRooms);
    })


} catch (err) {
    console.error(err)
}



module.exports = router;