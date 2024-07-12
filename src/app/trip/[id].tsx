import { useEffect, useState } from "react";
import { Alert, Keyboard, Text, TouchableOpacity, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { CalendarRange, Info, MapPin, Settings2, Calendar as IconCalendar, Key } from "lucide-react-native";
import dayjs from "dayjs";

import { TripDetails, tripServer } from "@/server/trip-server";

import { Loading } from "@/components/loading";
import { Button } from "@/components/button";
import { Input } from "@/components/input";
import { colors } from "@/styles/colors";
import { Activities } from "./activities";
import { Details } from "./details";
import { Modal } from "@/components/modal";
import { Calendar } from "@/components/calendar";
import { DateData } from "react-native-calendars";
import { calendarUtils, DatesSelected } from "@/utils/calendarUtils";


export type TripData = TripDetails & {
    when: string
}

enum MODAL {
    NONE = 0,
    UPDATE_TRIP = 1,
    CALENDAR = 2,
}

export default function Trip() {
    // LOADING
    const [isLoadingTrip, setIsLoadingTrip] = useState(true)
    const [isUpdatingTrip, setIsUpdatingTrip] = useState(false)

    // MODAL
    const [showModal, setShowModal] = useState(MODAL.NONE)

    // DATA
    const [tripDetails, setTripDetails] = useState({} as TripData)
    const [option, setOption] = useState<"activity" | "details">("activity")
    const [destination, setDestination] = useState("")
    const [selectedDates, setSelectedDates] = useState({} as DatesSelected)

    const tripId = useLocalSearchParams<{ id: string }>().id;

    async function getTripDetails() {
        try {
            setIsLoadingTrip(true)

            if (!tripId) {
                return router.back()
            }

            const trip = await tripServer.getById(tripId)

            const maxLengthDestination = 14
            const destination = trip.destination.length > maxLengthDestination
                ? trip.destination.slice(0, maxLengthDestination)
                : trip.destination

            const starts_at = dayjs(trip.starts_at).format("DD")
            const ends_at = dayjs(trip.ends_at).format("DD")
            const month = dayjs(trip.starts_at).format("MMM")

            setDestination(tripDetails.destination)

            console.log("destination", destination)

            setTripDetails({
                ...trip,
                when: `${destination} - from ${starts_at} to ${ends_at} ${month}.`

            })

        } catch (error) {
            console.log(error)
        } finally {
            setIsLoadingTrip(false)
        }
    }

    function handleSelectDate(selectedDay: DateData) {
        const dates = calendarUtils.orderStartsAtAndEndsAt({
            startsAt: selectedDates.startsAt,
            endsAt: selectedDates.endsAt,
            selectedDay
        })

        setSelectedDates(dates)
    }

    async function handleUpdateTrip() {
        try {
            if (!tripId) {
                return
            }

            if (!destination || !selectedDates.startsAt || !selectedDates.endsAt) {
                return Alert.alert("Trip update", "Remind, beyond the destination, you need to select the departure and return dates.")
            }

            setIsUpdatingTrip(true)

            tripServer.update({
                id: tripId,
                destination,
                starts_at: dayjs(selectedDates.startsAt.dateString).toString(),
                ends_at: dayjs(selectedDates.endsAt.dateString).toString()
            })

            Alert.alert("Trip update", "Trip updated successfully.", [
                {
                    text: "OK",
                    onPress: () => {
                        setShowModal(MODAL.NONE)
                        getTripDetails()
                    }
                }
            ])
        } catch (error) {
            console.log(error)
        }
        finally {
            setIsUpdatingTrip(false)
        }
    }

    useEffect(() => {
        getTripDetails()
    }, [])

    if (isLoadingTrip) {
        return <Loading />
    }

    return <View className="flex-1 px-5 pt-16">
        <Input variant="tertiary">
            <MapPin color={colors.zinc[400]} size={20} />
            <Input.Field placeholder="Destination" value={tripDetails.when} readOnly />
            <TouchableOpacity
                activeOpacity={0.6}
                className="w-9 h-9 bg-zinc-800 items-center justify-center rounded"
                onPress={() => setShowModal(MODAL.UPDATE_TRIP)}
            >
                <Settings2 color={colors.zinc[400]} size={20} />
            </TouchableOpacity>
        </Input>
        {
            option === "activity" ? <Activities tripDetails={tripDetails} /> : <Details tripId={tripDetails.id} />
        }

        <View className="w-full absolute -bottom-1 self-center justify-end pb-5 z-10 bg-zinc-950">
            <View className="w-full flex-row bg-zinc-900 p-4 rounded-lg border border-zinc-800 gap-2">
                <Button className="flex-1" onPress={() => setOption("activity")}
                    variant={option === "activity" ? "primary" : "secondary"}
                >
                    <CalendarRange color={
                        option === "activity" ? colors.lime[950] : colors.zinc[200]
                    }
                        size={20}
                    />
                    <Button.Title>Activites</Button.Title>
                </Button>

                <Button className="flex-1" onPress={() => setOption("details")}
                    variant={option === "details" ? "primary" : "secondary"}
                >
                    <Info color={
                        option === "details" ? colors.lime[950] : colors.zinc[200]
                    }
                        size={20}
                    />
                    <Button.Title>Details</Button.Title>
                </Button>
            </View>
        </View>

        <Modal
            title="Update trip"
            subtitle="Only the owner of the trip can update it."
            visible={showModal === MODAL.UPDATE_TRIP}
            onClose={() => setShowModal(MODAL.NONE)}
        >
            <View className="gap-2 my-4">
                <Input variant="secondary">
                    <MapPin color={colors.zinc[400]} size={20} />
                    <Input.Field
                        placeholder="Where?"
                        onChangeText={setDestination}
                        value={destination}
                    />
                </Input>
                <Input variant="secondary">
                    <IconCalendar color={colors.zinc[400]} size={20} />
                    <Input.Field
                        placeholder="When?"
                        value={selectedDates.formatDatesInText}
                        onPressIn={() => setShowModal(MODAL.CALENDAR)}
                        onFocus={() => Keyboard.dismiss()}
                    />
                </Input>

                <Button onPress={handleUpdateTrip} isLoading={isUpdatingTrip}>
                    <Button.Title>Update</Button.Title>
                </Button>
            </View>
        </Modal>

        <Modal
            title='Select dates'
            subtitle='Select the departure and return dates'
            visible={showModal == MODAL.CALENDAR}
            onClose={() => setShowModal(MODAL.NONE)}
        >
            <View className='gap-4 mt-4'>
                <Calendar
                    minDate={dayjs().toString()}
                    onDayPress={handleSelectDate}
                    markedDates={selectedDates.dates}
                />

                <Button onPress={() => setShowModal(MODAL.UPDATE_TRIP)}>
                    <Button.Title>Confirm</Button.Title>
                </Button>
            </View>
        </Modal>
    </View>
}