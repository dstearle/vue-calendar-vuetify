
<template>

    <v-row class="fill-height">

        <v-col>

            <!-- Top Toolbar -->
            <v-sheet height="64">

                <v-toolbar flat color="white">

                    <!-- New Event Button -->
                    <v-btn color="primary" class="mr-4" @click="dialog = true" dark>
                        New Event
                    </v-btn>

                    <!-- Today Button -->
                    <v-btn outlined class="mr-4" color="grey darken-2" @click="setToday">
                        Today
                    </v-btn>

                    <!-- Left Button -->
                    <v-btn fab text small color="grey darken-2" @click="prev">
                        <v-icon small>mdi-chevron-left</v-icon>
                    </v-btn>

                    <!-- Right Button -->
                    <v-btn fab text small color="grey darken-2" @click="next">
                        <v-icon small>mdi-chevron-right</v-icon>
                    </v-btn>

                    <!-- Title -->
                    <v-toolbar-title v-if="$refs.calendar">
                        {{ $refs.calendar.title }}
                    </v-toolbar-title>

                    <v-spacer></v-spacer>

                    <v-menu bottom right>

                        <template v-slot:activator="{ on, attrs }">

                        <v-btn
                            outlined
                            color="grey darken-2"
                            v-bind="attrs"
                            v-on="on"
                        >

                            <span>{{ typeToLabel[type] }}</span>

                            <v-icon right>mdi-menu-down</v-icon>

                        </v-btn>

                        </template>

                        <v-list>

                        <v-list-item @click="type = 'day'">
                            <v-list-item-title>Day</v-list-item-title>
                        </v-list-item>

                        <v-list-item @click="type = 'week'">
                            <v-list-item-title>Week</v-list-item-title>
                        </v-list-item>

                        <v-list-item @click="type = 'month'">
                            <v-list-item-title>Month</v-list-item-title>
                        </v-list-item>
                        
                        <v-list-item @click="type = '4day'">
                            <v-list-item-title>4 days</v-list-item-title>
                        </v-list-item>

                        </v-list>

                    </v-menu>

                </v-toolbar>

            </v-sheet>

            <!-- Toolbar Event Dialog -->
            <v-dialog v-model="dialog" max-width="500">

                <v-card>

                    <v-container>

                        <!-- Add Event Form -->
                        <v-form @submit.prevent="addEvent">

                            <!-- Name -->
                            <v-text-field v-model="name" type="text" label="Event Name (required)"></v-text-field>

                            <!-- Details -->
                            <v-text-field v-model="details" type="text" label="Details"></v-text-field>

                            <!-- Start Date -->
                            <v-text-field v-model="start" type="date" label="Start Date (required)"></v-text-field>

                            <!-- End Date -->
                            <v-text-field v-model="end" type="date" label="End Date (required)"></v-text-field>

                            <!-- Color -->
                            <v-text-field v-model="color" type="color" label="Color (click to open color menu)"></v-text-field>

                            <!-- Submit Button -->
                            <v-btn type="submit" color="primary" class="mr-4" @click.stop="dialog = false">Create Event</v-btn>

                        </v-form>

                    </v-container>

                </v-card>

            </v-dialog>

            <!-- Calendar -->
            <v-sheet height="600">

                <v-calendar
                    ref="calendar"
                    v-model="focus"
                    color="primary"
                    :events="events"
                    :event-color="getEventColor"
                    :now="today"
                    :type="type"
                    @click:event="showEvent"
                    @click:more="viewDay"
                    @click:date="viewDay"
                    @change="updateRange"
                ></v-calendar>

                <!-- Popup Menu -->
                <v-menu
                    v-model="selectedOpen"
                    :close-on-content-click="false"
                    :activator="selectedElement"
                    offset-x
                >

                    <v-card
                        color="grey lighten-4"
                        min-width="350px"
                        flat
                    >

                        <v-toolbar
                            :color="selectedEvent.color"
                            dark
                        >

                            <!-- Delete Event -->
                            <v-btn @click="deleteEvent(selectedEvent.id)" icon>

                                <v-icon>mdi-delete</v-icon>

                            </v-btn>

                            <v-toolbar-title v-html="selectedEvent.name"></v-toolbar-title>

                            <v-spacer></v-spacer>

                        </v-toolbar>

                        <!-- Forms -->
                        <v-card-text>
                            
                            <!-- If not currently editing -->
                            <form v-if="currentlyEditing !== selectedEvent.id">

                                {{ selectedEvent.details }}
                                
                            </form>

                            <!-- If currently editing -->
                            <form v-else>

                                <textarea-autosize
                                    v-model="selectedEvent.details"
                                    type="text"
                                    style="width: 100%;"
                                    :min-height="100"
                                    placeholder="Add Note"
                                ></textarea-autosize>

                            </form>

                        </v-card-text>

                        <!-- Popup Actions -->
                        <v-card-actions>

                            <!-- Closes the popup -->
                            <v-btn
                                text
                                color="secondary"
                                @click="selectedOpen = false"
                            >
                                Close
                            </v-btn>

                            <!-- Edit Button -->
                            <v-btn
                                text
                                v-if="currentlyEditing !== selectedEvent.id"
                                @click.prevent="editEvent(selectedEvent)"
                            >
                                Edit
                            </v-btn>

                            <!-- Save Button -->
                            <v-btn
                                text
                                v-else
                                @click.prevent="updateEvent(selectedEvent)"
                            >
                                Save
                            </v-btn>

                        </v-card-actions>

                    </v-card>

                </v-menu>

            </v-sheet>

        </v-col>

    </v-row>

</template>

<script>

    import { db } from '@/main';

    export default {

        components: {
            
        },

        data: () => ({

            // Calendar Fields
            today: new Date().toISOString().substr(0, 10),
            focus: new Date().toISOString().substr(0, 10),
            type: "month",
            typeToLabel: {
                month: "Month",
                week: "Week",
                day: 'Day',
                "4day": "4 Days"
            },

            // Firbase
            name: null,
            details: null,
            start: null,
            end: null,
            color: "#FF5733",
            currentlyEditing: null,
            selectedEvent: {},
            selectedElement: null,
            selectedOpen: false,
            events: [],
            dialog: false,

        }),

        mounted() {

            this.getEvents();

        },

        methods: {

            // Connects to firebase
            async getEvents() {

                // The snapshot of the data collection
                let snapshot = await db.collection('calEvent').get();

                // Array to hold the data retrieved from firebase
                let eventsArray = [];

                snapshot.forEach(doc => {

                    // console.log(doc.data());

                    // The data stored in firebase, except the id
                    let appData = doc.data();

                    // Sets the id to the retrieved data
                    appData.id = doc.id;

                    // Pushes the retrieved data to the events array
                    eventsArray.push(appData);

                });

                // Sets the data to the calendar 
                this.events = eventsArray;

            },

            // Adds a new event to the calendar and firebase
            async addEvent() {

                // If form fields are filled
                if(this.name && this.start && this.end) {

                    // Adds new calendar event details to firebase
                    await db.collection('calEvent').add({

                        name: this.name,
                        details: this.details,
                        start: this.start,
                        end: this.end,
                        color: this.color,

                    });

                    // Shows the updated calendar
                    this.getEvents();

                    // Clears form fields
                    this.name = "";
                    this.details = "";
                    this.start = "";
                    this.end = "";
                    this.color = "#FF5733";

                }

                // Else alert user that they are stupid
                else { alert('Name, start and end date required') }

            },

            // Updates the calendar event and firebase
            async updateEvent(ev) {

                // Promise that updates the details for the event
                await db.collection('calEvent').doc(this.currentlyEditing).update({

                    details: ev.details

                })

                // Closes the event
                this.selectedOpen = false;

                // Sets currently editing status back to null
                this.currentlyEditing = null;

            },

            // Deletes the calendar event and firebase
            async deleteEvent(ev) {

                // Promise that deletes the details for the event
                await db.collection('calEvent').doc(ev).delete()

                // Closes the event
                this.selectedOpen = false;

                // Shows the updated calendar
                this.getEvents();

            },

            // Retrieves the color for each calendar event
            getEventColor(ev) {

                return ev.color

            },

            // Shows the user the selected day
            viewDay ({ date }) {
                this.focus = date
                this.type = 'day'
            },

            // Sets focus to selected day
            setToday () {
                this.focus = ''
            },

            // Previous selected month
            prev () {
                this.$refs.calendar.prev()
            },

            // Next selected month
            next () {
                this.$refs.calendar.next()
            },

            // Edits the calendar event
            editEvent(ev) {

                this.currentlyEditing = ev.id

            },

            // Popup for when user clicks on a day
            showEvent ({ nativeEvent, event }) {
                const open = () => {
                    this.selectedEvent = event
                    this.selectedElement = nativeEvent.target
                    setTimeout(() => this.selectedOpen = true, 10)
                }

                if (this.selectedOpen) {
                    this.selectedOpen = false
                    setTimeout(open, 10)
                } else {
                    open()
                }

                nativeEvent.stopPropagation()
            },

            // The updated selected range of dates
            updateRange ({ start, end }) {

                this.start = start
                this.end = end
                
            },

            // Random number method
            rnd (a, b) {
                return Math.floor((b - a + 1) * Math.random()) + a
            },

        },
        
    };

</script>