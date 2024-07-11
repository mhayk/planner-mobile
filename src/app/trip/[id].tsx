import { Input } from "@/components/input";
import { Loading } from "@/components/loading";
import { TripDetails, tripServer } from "@/server/trip-server";
import { colors } from "@/styles/colors";
import dayjs from "dayjs";
import { router, useLocalSearchParams } from "expo-router";
import { MapPin, Settings2 } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";

type TripData = TripDetails & {
    when: string
}

export default function Trip() {
    // LOADING
    const [isLoadingTrip, setIsLoadingTrip] = useState(true)

    // DATA
    const [tripDetails, setTripDetails] = useState({} as TripData)

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
            >
                <Settings2 color={colors.zinc[400]} size={20} />
            </TouchableOpacity>
        </Input>
    </View>
}