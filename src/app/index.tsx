import { View, Text, Image, Keyboard, Alert } from 'react-native';
import {
    MapPin,
    Calendar as IconCalendar,
    Settings2,
    UserRoundPlus,
    ArrowRight,
    AtSign
} from 'lucide-react-native'
import { useState } from 'react';
import { DateData } from 'react-native-calendars';
import dayjs from 'dayjs';

import { colors } from '@/styles/colors';
import { tripStorage } from '@/storage/trip';
import { validateInput } from '@/utils/validateInput';
import { DatesSelected, calendarUtils } from '@/utils/calendarUtils';


import { Modal } from '@/components/modal';
import { Input } from '@/components/input';
import { Button } from '@/components/button';
import { GuestEmail } from '@/components/email';
import { Calendar } from '@/components/calendar';
import { router } from 'expo-router';
import { tripServer } from '@/server/trip-server';

enum StepForm {
    TRIP_DETAILS = 1,
    ADD_EMAILS = 2,
}

enum MODAL {
    NONE = 0,
    CALENDAR = 1,
    GUESTS = 2
}

export default function Index() {
    // LOADING
    const [isCreatingTrip, setIsCreatingTrip] = useState(false)

    // DATA
    const [stepForm, setStepForm] = useState(StepForm.TRIP_DETAILS)
    const [selectedDates, setSelectedDates] = useState({} as DatesSelected)
    const [destination, setDestination] = useState("")
    const [emailToInvite, setEmailToInvite] = useState("")
    const [emailsToInvite, setEmailsToInvite] = useState<string[]>([])

    // MODAL
    const [showModal, setShowModal] = useState(MODAL.NONE)

    function handleNextStepForm() {
        if (
            destination.trim().length === 0 ||
            !selectedDates.startsAt ||
            !selectedDates.endsAt) {
            return Alert.alert(
                'Trip details',
                'Please fill in all trip details before continuing.'
            )
        }

        if (destination.length < 4) {
            return Alert.alert(
                'Trip details',
                'The destination must have at least 4 characters.'
            )
        }

        if (stepForm === StepForm.TRIP_DETAILS) {
            setStepForm(StepForm.ADD_EMAILS)
        }

        Alert.alert(
            "New trip",
            "Do you want to save this trip to access it later?",
            [
                {
                    text: "No",
                    style: "cancel"
                },
                {
                    text: "Yes",
                    onPress: createTrip
                }
            ]
        )
    }

    function handleSelectDate(selectedDay: DateData) {
        const dates = calendarUtils.orderStartsAtAndEndsAt({
            startsAt: selectedDates.startsAt,
            endsAt: selectedDates.endsAt,
            selectedDay
        })

        setSelectedDates(dates)
    }

    function handleRemoveEmail(emailToRemove: string) {
        setEmailsToInvite((prevState) =>
            prevState.filter(email => email !== emailToRemove)
        )
    }

    function handleAddEmail() {
        if (!validateInput.email(emailToInvite)) {
            return Alert.alert('Invalid e-mail', 'Please enter a valid e-mail.')
        }

        const emailAlreadyExists = emailsToInvite.find((email) => email === emailToInvite)

        if (emailAlreadyExists) {
            return Alert.alert('E-mail already added', 'This e-mail is already in the list.')
        }

        setEmailsToInvite((prevState) => [...prevState, emailToInvite])
        setEmailToInvite("")
    }

    async function saveTrip(tripdId: string) {
        try {
            console.log("save trip", tripdId)
            await tripStorage.save(tripdId)
            router.navigate("/trip/" + tripdId)
        } catch (error) {
            Alert.alert(
                'Save trip',
                'It was not possible to save the trip id in the storage.'
            )

            console.log(error)
        }
    }

    async function createTrip() {
        try {
            setIsCreatingTrip(true)
            const newTrip = await tripServer.create({
                destination,
                starts_at: dayjs(selectedDates.startsAt?.dateString).toISOString(),
                ends_at: dayjs(selectedDates.endsAt?.dateString).toISOString(),
                emails_to_invite: emailsToInvite
            })

            Alert.alert(
                "New trip",
                "Trip created successfully!",
                [
                    {
                        text: "OK. Continue.",
                        onPress: () => saveTrip(newTrip.tripId)
                    }
                ]
            )
        } catch (error) {
            console.log(error)
            setIsCreatingTrip(false)
        }
    }

    return (
        <View className='flex-1 items-center justify-center px-5'>
            <Image source={require('@/assets/logo.png')}
                className='h-8'
                resizeMode='contain'
            />

            <Image source={require('@/assets/bg.png')} className='absolute' />
            <Text className='text-zinc-400 font-regular text-center text-lg mt-3'>
                Invite your friends and plan your{"\n"} next trip
            </Text>

            <View className='w-full bg-zinc-900 p-4 rounded-lg my-8 border-zinc-800'>

                <Input>
                    <MapPin color={colors.zinc[400]} size={20} />
                    <Input.Field
                        placeholder='Where ?'
                        editable={stepForm === StepForm.TRIP_DETAILS}
                        onChangeText={setDestination}
                        value={destination}
                    />
                </Input>

                <Input>
                    <IconCalendar color={colors.zinc[400]} size={20} />
                    <Input.Field
                        placeholder='When ?'
                        editable={stepForm === StepForm.TRIP_DETAILS}
                        onFocus={() => Keyboard.dismiss()}
                        showSoftInputOnFocus={false}
                        onPressIn={() =>
                            stepForm == StepForm.TRIP_DETAILS && setShowModal(MODAL.CALENDAR)
                        }
                        value={selectedDates.formatDatesInText}
                    />
                </Input>
                {stepForm === StepForm.ADD_EMAILS && (
                    <>
                        <View className='border-b py-3 border-zinc-800'>
                            <Button variant='secondary' onPress={() => setStepForm(StepForm.TRIP_DETAILS)}>
                                <Button.Title>Change place/date</Button.Title>
                                <Settings2 color={colors.zinc[200]} size={20} />
                            </Button>
                        </View>

                        <Input>
                            <UserRoundPlus color={colors.zinc[400]} size={20} />
                            <Input.Field
                                placeholder='Who will be in the trip?'
                                autoCorrect={false}
                                value={
                                    emailsToInvite.length > 0
                                        ? `${emailsToInvite.length} guest(s) invited`
                                        : ''
                                }
                                onPress={() => {
                                    Keyboard.dismiss()
                                    setShowModal(MODAL.GUESTS)
                                }}
                                showSoftInputOnFocus={false}
                            />
                        </Input>
                    </>
                )}

                <Button onPress={handleNextStepForm} isLoading={isCreatingTrip}>
                    <Button.Title>
                        {
                            stepForm === StepForm.TRIP_DETAILS
                                ? 'Continue'
                                : 'Confirm trip'

                        }
                    </Button.Title>
                    <ArrowRight color={colors.lime[950]} size={20} />
                </Button>
            </View>

            <Text className='text-zinc-500 font-regular text-center text-base'>
                When planning your trip through plann.er you automatically agree to our{" "}
                <Text className='text-zinc-300 underline'>
                    terms of use and privacy policies.
                </Text>
            </Text>

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

                    <Button onPress={() => setShowModal(MODAL.NONE)}>
                        <Button.Title>Confirm</Button.Title>
                    </Button>
                </View>
            </Modal>

            <Modal
                title="Select guests"
                subtitle="The guests will receive e-mails to confirm to join the trip"
                visible={showModal === MODAL.GUESTS}
                onClose={() => setShowModal(MODAL.NONE)}
            >
                <View
                    className='my-2 flex-wrap gap-2 border-b border-zinc-800 py-5 items-start'
                >
                    {
                        emailsToInvite.length > 0 ? (
                            emailsToInvite.map((email, index) => (
                                <GuestEmail
                                    key={index}
                                    email={email}
                                    onRemove={() => handleRemoveEmail(email)}
                                />
                            ))
                        ) : (
                            <Text
                                className='text-zinc-600 text-base font-regular'
                            >
                                No email added
                            </Text>
                        )
                    }
                </View>

                <View className='gap-4 mt-4'>
                    <Input variant='secondary'>
                        <AtSign color={colors.zinc[400]} size={20} />
                        <Input.Field
                            placeholder='Add the guest e-mail'
                            keyboardType='email-address'
                            onChangeText={(text) => setEmailToInvite(text.toLowerCase())}
                            value={emailToInvite}
                            returnKeyType='send'
                            onSubmitEditing={handleAddEmail}
                        />
                    </Input>

                    <Button onPress={handleAddEmail}>
                        <Button.Title>Invite</Button.Title>
                    </Button>
                </View>
            </Modal>
        </View>
    )
}