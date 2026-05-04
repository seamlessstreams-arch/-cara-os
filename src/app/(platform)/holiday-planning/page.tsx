"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOLIDAY & TRIP PLANNING
// Manages planned outings, day trips, holidays, and residential trips for young
// people. Includes risk assessments, consent tracking, itineraries, staffing
// ratios, and post-trip evaluations. Regulation 13 (engagement in activities)
// compliance.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/common/export-button";
import { PrintButton } from "@/components/common/print-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus, Search, Filter, ArrowUpDown, ChevronDown, ChevronUp,
  MapPin, CheckCircle2, Clock, Calendar, AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName, getYPName } from "@/lib/seed-data";

// ── Types ────────────────────────────────────────────────────────────────────

type TripType = "day_trip" | "overnight" | "residential" | "holiday" | "educational_visit" | "activity_outing";
type TripStatus = "planning" | "approved" | "ready" | "in_progress" | "completed" | "cancelled";
type RiskLevel = "low" | "medium" | "high";
type StaffRole = "lead" | "support" | "driver";

interface TripPlan {
  id: string;
  title: string;
  tripType: TripType;
  destination: string;
  startDate: string;
  endDate: string;
  departureTime: string;
  returnTime: string;
  youngPeople: { youngPersonId: string; consentObtained: boolean; consentFrom: string; medicalInfoShared: boolean; behaviourPlanShared: boolean }[];
  staffAssigned: { staffId: string; role: StaffRole; sleepIn: boolean }[];
  staffRatio: string;
  riskAssessment: {
    completed: boolean;
    completedBy: string | null;
    completedDate: string | null;
    overallRisk: RiskLevel;
    hazards: { hazard: string; likelihood: number; impact: number; controls: string }[];
  };
  itinerary: { time: string; activity: string; location: string; notes: string }[];
  budget: { item: string; estimated: number; actual: number | null }[];
  totalBudget: number;
  transport: string;
  accommodation: string | null;
  emergencyPlan: string;
  socialWorkerApproval: { youngPersonId: string; approved: boolean; approvedDate: string | null }[];
  managerApproval: boolean;
  managerApprovedBy: string | null;
  childrenViews: string;
  postTripEvaluation: { rating: number; highlights: string; concerns: string; wouldRepeat: boolean; childFeedback: string } | null;
  status: TripStatus;
  notes: string;
}

// ── Config ───────────────────────────────────────────────────────────────────

const TRIP_TYPE_CONFIG: Record<TripType, { label: string; cls: string }> = {
  day_trip:           { label: "Day Trip",           cls: "bg-blue-50 text-blue-700 border-blue-200" },
  overnight:          { label: "Overnight",          cls: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  residential:        { label: "Residential",        cls: "bg-purple-50 text-purple-700 border-purple-200" },
  holiday:            { label: "Holiday",            cls: "bg-teal-50 text-teal-700 border-teal-200" },
  educational_visit:  { label: "Educational Visit",  cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  activity_outing:    { label: "Activity Outing",    cls: "bg-green-50 text-green-700 border-green-200" },
};

const STATUS_CONFIG: Record<TripStatus, { label: string; cls: string }> = {
  planning:    { label: "Planning",    cls: "bg-gray-50 text-gray-700 border-gray-200" },
  approved:    { label: "Approved",    cls: "bg-blue-50 text-blue-700 border-blue-200" },
  ready:       { label: "Ready",       cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  in_progress: { label: "In Progress", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  completed:   { label: "Completed",   cls: "bg-green-50 text-green-700 border-green-200" },
  cancelled:   { label: "Cancelled",   cls: "bg-red-50 text-red-700 border-red-200" },
};

const RISK_CONFIG: Record<RiskLevel, { label: string; cls: string }> = {
  low:    { label: "Low",    cls: "bg-green-50 text-green-700 border-green-200" },
  medium: { label: "Medium", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  high:   { label: "High",   cls: "bg-red-50 text-red-700 border-red-200" },
};

// ── Date helper ──────────────────────────────────────────────────────────────

const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

// ── Seed data ────────────────────────────────────────────────────────────────

const SEED_TRIPS: TripPlan[] = [
  {
    id: "trip_001",
    title: "Summer Beach Day",
    tripType: "day_trip",
    destination: "Blackpool",
    startDate: d(-14),
    endDate: d(-14),
    departureTime: "08:30",
    returnTime: "19:00",
    youngPeople: [
      { youngPersonId: "yp_alex", consentObtained: true, consentFrom: "Social Worker — Karen Holding", medicalInfoShared: true, behaviourPlanShared: true },
      { youngPersonId: "yp_jordan", consentObtained: true, consentFrom: "Social Worker — Michael Osei", medicalInfoShared: true, behaviourPlanShared: true },
      { youngPersonId: "yp_casey", consentObtained: true, consentFrom: "Social Worker — Fiona Brennan", medicalInfoShared: true, behaviourPlanShared: true },
    ],
    staffAssigned: [
      { staffId: "staff_darren", role: "lead", sleepIn: false },
      { staffId: "staff_anna", role: "support", sleepIn: false },
    ],
    staffRatio: "1:2",
    riskAssessment: {
      completed: true,
      completedBy: "staff_darren",
      completedDate: d(-21),
      overallRisk: "low",
      hazards: [
        { hazard: "Water safety — beach and sea", likelihood: 2, impact: 4, controls: "Staff in water at all times, no swimming beyond waist depth, lifeguard beach selected" },
        { hazard: "Sun exposure", likelihood: 3, impact: 2, controls: "SPF50 applied hourly, hats provided, shade sought during midday" },
        { hazard: "Missing from group in public", likelihood: 2, impact: 4, controls: "Buddy system, regular headcounts every 15 minutes, meeting point established" },
      ],
    },
    itinerary: [
      { time: "08:30", activity: "Depart Oak House", location: "Oak House", notes: "Packed lunches, sun cream, towels loaded" },
      { time: "10:30", activity: "Arrive Blackpool — beach time", location: "South Beach, Blackpool", notes: "Set up base near lifeguard station" },
      { time: "12:30", activity: "Lunch on the beach", location: "South Beach", notes: "Packed lunches + option to buy ice cream" },
      { time: "14:00", activity: "Pleasure Beach / Arcades", location: "Blackpool Promenade", notes: "Budget of £10pp for arcades" },
      { time: "17:00", activity: "Depart Blackpool", location: "Car park", notes: "Final headcount before leaving" },
    ],
    budget: [
      { item: "Fuel", estimated: 40, actual: 38 },
      { item: "Parking", estimated: 15, actual: 12 },
      { item: "Packed lunches", estimated: 20, actual: 18 },
      { item: "Arcade money (3 YP)", estimated: 30, actual: 30 },
      { item: "Ice creams & snacks", estimated: 15, actual: 14 },
    ],
    totalBudget: 120,
    transport: "Oak House minibus",
    accommodation: null,
    emergencyPlan: "Nearest A&E: Blackpool Victoria Hospital. Staff carry first aid kit, emergency contacts, and medication. Return to vehicle if weather turns or any YP becomes distressed.",
    socialWorkerApproval: [
      { youngPersonId: "yp_alex", approved: true, approvedDate: d(-18) },
      { youngPersonId: "yp_jordan", approved: true, approvedDate: d(-19) },
      { youngPersonId: "yp_casey", approved: true, approvedDate: d(-17) },
    ],
    managerApproval: true,
    managerApprovedBy: "staff_darren",
    childrenViews: "All three young people were excited and helped plan the day. Alex wanted to go to the arcades, Jordan asked about swimming, and Casey requested fish and chips. We incorporated everyone's wishes into the itinerary.",
    postTripEvaluation: {
      rating: 4,
      highlights: "All three YP had a brilliant day. Jordan swam in the sea for the first time and was incredibly proud. Alex was calm and regulated all day. Casey enjoyed the promenade walk and bonded with Anna.",
      concerns: "Alex got slightly anxious in the arcade crowds but managed it with support. Need to plan a quieter alternative next time for busy periods.",
      wouldRepeat: true,
      childFeedback: "Jordan: 'Best day ever, can we go every week?' Alex: 'The arcades were sick.' Casey: 'I liked the donkeys on the beach.'",
    },
    status: "completed",
    notes: "Excellent day out. All consent, risk assessments, and medication documentation completed prior to departure.",
  },
  {
    id: "trip_002",
    title: "Alton Towers Trip",
    tripType: "activity_outing",
    destination: "Alton Towers, Staffordshire",
    startDate: d(5),
    endDate: d(5),
    departureTime: "08:00",
    returnTime: "20:00",
    youngPeople: [
      { youngPersonId: "yp_alex", consentObtained: true, consentFrom: "Social Worker — Karen Holding", medicalInfoShared: true, behaviourPlanShared: true },
      { youngPersonId: "yp_jordan", consentObtained: true, consentFrom: "Social Worker — Michael Osei", medicalInfoShared: true, behaviourPlanShared: false },
    ],
    staffAssigned: [
      { staffId: "staff_ryan", role: "lead", sleepIn: false },
      { staffId: "staff_edward", role: "support", sleepIn: false },
      { staffId: "staff_anna", role: "driver", sleepIn: false },
    ],
    staffRatio: "3:2",
    riskAssessment: {
      completed: true,
      completedBy: "staff_ryan",
      completedDate: d(-3),
      overallRisk: "medium",
      hazards: [
        { hazard: "Theme park rides — physical injury", likelihood: 1, impact: 4, controls: "Only age/height-appropriate rides, staff on ride with YP where possible" },
        { hazard: "Crowds and sensory overload — Jordan", likelihood: 3, impact: 3, controls: "Quiet zone identified on park map, ear defenders available, regular check-ins with Jordan" },
        { hazard: "Separation in large venue", likelihood: 2, impact: 4, controls: "Meet-up point at entrance fountain every 2 hours, YP have staff mobile numbers" },
        { hazard: "Food allergies — Jordan (Penicillin)", likelihood: 1, impact: 5, controls: "Medication carried, staff aware of allergy, pre-checked restaurant menus" },
      ],
    },
    itinerary: [
      { time: "08:00", activity: "Depart Oak House", location: "Oak House", notes: "Breakfast before departure" },
      { time: "09:30", activity: "Arrive Alton Towers", location: "Alton Towers car park", notes: "Collect tickets from kiosk" },
      { time: "10:00", activity: "Morning rides — X-Sector area", location: "X-Sector, Alton Towers", notes: "Oblivion, The Smiler if YP want to" },
      { time: "12:30", activity: "Lunch", location: "Alton Towers food court", notes: "Budget of £12pp — check for Jordan's dietary needs (Halal)" },
      { time: "14:00", activity: "Afternoon rides and attractions", location: "Various", notes: "CBeebies Land available if overwhelmed by big rides" },
      { time: "18:00", activity: "Depart Alton Towers", location: "Car park", notes: "Headcount, collect belongings" },
    ],
    budget: [
      { item: "Tickets (2 YP + 3 staff)", estimated: 150, actual: null },
      { item: "Fuel", estimated: 30, actual: null },
      { item: "Parking", estimated: 15, actual: null },
      { item: "Lunch (5 people)", estimated: 60, actual: null },
      { item: "Snacks and drinks", estimated: 25, actual: null },
    ],
    totalBudget: 280,
    transport: "Oak House minibus",
    accommodation: null,
    emergencyPlan: "Nearest A&E: Royal Stoke University Hospital (20 mins). On-site first aid at Alton Towers. Staff carry medication, emergency contacts, and first aid kit. Exit plan via main gate if needed.",
    socialWorkerApproval: [
      { youngPersonId: "yp_alex", approved: true, approvedDate: d(-2) },
      { youngPersonId: "yp_jordan", approved: true, approvedDate: d(-1) },
    ],
    managerApproval: true,
    managerApprovedBy: "staff_darren",
    childrenViews: "Alex has been asking about Alton Towers for weeks and is very excited about The Smiler. Jordan is keen but a bit nervous about the big rides — said they want to watch first and decide. Both chose what to have for lunch.",
    postTripEvaluation: null,
    status: "ready",
    notes: "Jordan's behaviour plan still to be shared with Edward before the trip. Ensure Halal lunch options are pre-checked.",
  },
  {
    id: "trip_003",
    title: "Lake District Weekend",
    tripType: "residential",
    destination: "Lake District, Cumbria",
    startDate: d(18),
    endDate: d(20),
    departureTime: "09:00",
    returnTime: "16:00",
    youngPeople: [
      { youngPersonId: "yp_alex", consentObtained: true, consentFrom: "Social Worker — Karen Holding", medicalInfoShared: true, behaviourPlanShared: true },
      { youngPersonId: "yp_jordan", consentObtained: true, consentFrom: "Social Worker — Michael Osei", medicalInfoShared: true, behaviourPlanShared: true },
      { youngPersonId: "yp_casey", consentObtained: false, consentFrom: "", medicalInfoShared: false, behaviourPlanShared: false },
    ],
    staffAssigned: [
      { staffId: "staff_darren", role: "lead", sleepIn: true },
      { staffId: "staff_chervelle", role: "support", sleepIn: true },
      { staffId: "staff_ryan", role: "driver", sleepIn: false },
    ],
    staffRatio: "1:1",
    riskAssessment: {
      completed: true,
      completedBy: "staff_darren",
      completedDate: d(-5),
      overallRisk: "medium",
      hazards: [
        { hazard: "Fell walking — slips, trips, falls", likelihood: 3, impact: 3, controls: "Appropriate footwear required, easy-grade trails only, walking poles available, weather check on day" },
        { hazard: "Water activities on lake", likelihood: 2, impact: 4, controls: "Life jackets mandatory, instructor-led sessions only, staff in water" },
        { hazard: "Overnight away — homesickness/anxiety", likelihood: 3, impact: 2, controls: "Familiar staff present, comfort items packed, clear return plan communicated to YP" },
        { hazard: "Casey — medication refusal risk away from home", likelihood: 3, impact: 3, controls: "Medication locked in staff possession, clear routine maintained, quiet private space for administration" },
        { hazard: "Remote location — emergency access", likelihood: 1, impact: 4, controls: "Vehicle on site at all times, nearest hospital mapped (45 min), mobile signal confirmed at accommodation" },
      ],
    },
    itinerary: [
      { time: "09:00", activity: "Depart Oak House", location: "Oak House", notes: "All luggage, medication, and documents loaded" },
      { time: "12:00", activity: "Arrive YHA Ambleside — check in", location: "YHA Ambleside", notes: "Unpack, orientation, room allocation" },
      { time: "13:00", activity: "Lunch in Ambleside", location: "Ambleside village", notes: "Pub lunch — check dietary requirements (Casey vegetarian, Jordan Halal)" },
      { time: "14:30", activity: "Gentle lake walk", location: "Lake Windermere shoreline", notes: "Easy flat walk to settle in, 2-3 miles" },
      { time: "17:30", activity: "Free time / games at hostel", location: "YHA Ambleside", notes: "Board games, TV room, garden" },
      { time: "19:00", activity: "Dinner at hostel", location: "YHA Ambleside", notes: "Pre-booked evening meal" },
      { time: "Day 2 AM", activity: "Kayaking on Windermere", location: "Lake Windermere", notes: "Instructor-led, life jackets mandatory" },
      { time: "Day 2 PM", activity: "Fell walking — Loughrigg Fell", location: "Loughrigg Fell", notes: "Easy grade, 2-hour route, packed lunch on summit" },
    ],
    budget: [
      { item: "YHA accommodation (2 nights, 6 people)", estimated: 180, actual: null },
      { item: "Fuel (return)", estimated: 60, actual: null },
      { item: "Food and meals", estimated: 120, actual: null },
      { item: "Kayaking session", estimated: 50, actual: null },
      { item: "Snacks and incidentals", estimated: 40, actual: null },
    ],
    totalBudget: 450,
    transport: "Oak House minibus",
    accommodation: "YHA Ambleside — 3 rooms booked (1 staff, 1 boys, 1 Casey)",
    emergencyPlan: "Nearest A&E: Westmorland General Hospital, Kendal (30 mins). Vehicle on site 24hrs. All staff carry first aid kits, torches, emergency contacts, medication. If any YP requests to return home, one staff member can drive back with them while others remain.",
    socialWorkerApproval: [
      { youngPersonId: "yp_alex", approved: true, approvedDate: d(-3) },
      { youngPersonId: "yp_jordan", approved: true, approvedDate: d(-2) },
      { youngPersonId: "yp_casey", approved: false, approvedDate: null },
    ],
    managerApproval: false,
    managerApprovedBy: null,
    childrenViews: "Alex is excited about kayaking and wants to 'conquer a mountain'. Jordan is looking forward to the hostel — asked if there's WiFi. Casey is hesitant about being away from Oak House overnight but said she'd try it if Chervelle is going. We've agreed Casey can call home whenever she wants.",
    postTripEvaluation: null,
    status: "planning",
    notes: "Awaiting Casey's social worker (Fiona Brennan) approval. Manager approval pending completion of all SW consents. Need to confirm YHA booking and kayaking instructor.",
  },
  {
    id: "trip_004",
    title: "Museum Visit",
    tripType: "educational_visit",
    destination: "Derby Museum & Art Gallery",
    startDate: d(-21),
    endDate: d(-21),
    departureTime: "10:00",
    returnTime: "14:00",
    youngPeople: [
      { youngPersonId: "yp_casey", consentObtained: true, consentFrom: "Social Worker — Fiona Brennan", medicalInfoShared: true, behaviourPlanShared: true },
    ],
    staffAssigned: [
      { staffId: "staff_anna", role: "lead", sleepIn: false },
    ],
    staffRatio: "1:1",
    riskAssessment: {
      completed: true,
      completedBy: "staff_anna",
      completedDate: d(-25),
      overallRisk: "low",
      hazards: [
        { hazard: "Public space — anxiety trigger", likelihood: 2, impact: 2, controls: "Quiet visit during weekday, exit plan discussed with Casey" },
        { hazard: "Walking in town centre", likelihood: 1, impact: 2, controls: "Pedestrian route planned, crossing at lights only" },
      ],
    },
    itinerary: [
      { time: "10:00", activity: "Walk to museum from Oak House", location: "Derby city centre", notes: "15 minute walk" },
      { time: "10:15", activity: "Explore ground floor — natural history", location: "Derby Museum", notes: "Casey interested in geology section" },
      { time: "11:30", activity: "Art gallery — upstairs", location: "Derby Museum", notes: "Wright of Derby paintings" },
      { time: "12:30", activity: "Lunch at museum cafe", location: "Derby Museum cafe", notes: "Vegetarian options available" },
      { time: "13:30", activity: "Gift shop and walk home", location: "Derby Museum / Oak House", notes: "Casey can choose a small gift (up to £5)" },
    ],
    budget: [
      { item: "Museum entry", estimated: 0, actual: 0 },
      { item: "Lunch (2 people)", estimated: 15, actual: 14 },
      { item: "Gift shop", estimated: 5, actual: 4 },
      { item: "Snacks", estimated: 5, actual: 3 },
    ],
    totalBudget: 25,
    transport: "Walking",
    accommodation: null,
    emergencyPlan: "Return to Oak House on foot (15 mins) or call for vehicle pickup. Nearest A&E: Royal Derby Hospital. Staff carry first aid kit and Casey's medication.",
    socialWorkerApproval: [
      { youngPersonId: "yp_casey", approved: true, approvedDate: d(-23) },
    ],
    managerApproval: true,
    managerApprovedBy: "staff_darren",
    childrenViews: "Casey asked to go to the museum after learning about fossils in school. She wanted to see the real ones. This was a child-led outing that we were happy to facilitate.",
    postTripEvaluation: {
      rating: 5,
      highlights: "Casey was incredibly engaged and spent 40 minutes studying the geology display. She asked thoughtful questions and was proud to tell staff facts she'd learned at school. She bought a fossil keyring from the gift shop and showed all the staff when she got home.",
      concerns: "None. This was an excellent outing.",
      wouldRepeat: true,
      childFeedback: "Casey: 'That was actually really cool. Can we go to the science museum in Birmingham next? I want to see the space bit.'",
    },
    status: "completed",
    notes: "Outstanding educational visit. Casey's enthusiasm was brilliant to see. Follow up on her request for Birmingham Science Museum.",
  },
  {
    id: "trip_005",
    title: "Cinema & Pizza",
    tripType: "activity_outing",
    destination: "INTU Derby — Showcase Cinema & Pizza Hut",
    startDate: d(-7),
    endDate: d(-7),
    departureTime: "16:00",
    returnTime: "21:00",
    youngPeople: [
      { youngPersonId: "yp_alex", consentObtained: true, consentFrom: "Social Worker — Karen Holding", medicalInfoShared: true, behaviourPlanShared: true },
      { youngPersonId: "yp_casey", consentObtained: true, consentFrom: "Social Worker — Fiona Brennan", medicalInfoShared: true, behaviourPlanShared: true },
    ],
    staffAssigned: [
      { staffId: "staff_diane", role: "lead", sleepIn: false },
    ],
    staffRatio: "1:2",
    riskAssessment: {
      completed: true,
      completedBy: "staff_diane",
      completedDate: d(-10),
      overallRisk: "low",
      hazards: [
        { hazard: "Shopping centre — crowded environment", likelihood: 2, impact: 2, controls: "Evening visit when quieter, direct route to cinema and restaurant" },
        { hazard: "Separation risk — Alex", likelihood: 2, impact: 3, controls: "Clear expectations set before arrival, Alex has staff mobile number" },
      ],
    },
    itinerary: [
      { time: "16:00", activity: "Depart Oak House", location: "Oak House", notes: "Drive to INTU" },
      { time: "16:20", activity: "Arrive INTU — Pizza Hut", location: "Pizza Hut, INTU Derby", notes: "Early dinner before film" },
      { time: "17:30", activity: "Walk to cinema, buy snacks", location: "Showcase Cinema, INTU Derby", notes: "YP can choose one snack each (up to £5)" },
      { time: "18:00", activity: "Film showing", location: "Showcase Cinema", notes: "Film chosen by YP — checked age rating" },
      { time: "20:15", activity: "Return to Oak House", location: "Oak House", notes: "Straight home after film" },
    ],
    budget: [
      { item: "Cinema tickets (3)", estimated: 24, actual: 22 },
      { item: "Pizza Hut dinner (3)", estimated: 25, actual: 27 },
      { item: "Cinema snacks", estimated: 10, actual: 8 },
      { item: "Fuel", estimated: 5, actual: 5 },
    ],
    totalBudget: 60,
    transport: "Oak House car",
    accommodation: null,
    emergencyPlan: "Return to Oak House by car (10 mins). Staff carry emergency contacts and medication. Nearest A&E: Royal Derby Hospital.",
    socialWorkerApproval: [
      { youngPersonId: "yp_alex", approved: true, approvedDate: d(-9) },
      { youngPersonId: "yp_casey", approved: true, approvedDate: d(-8) },
    ],
    managerApproval: true,
    managerApprovedBy: "staff_darren",
    childrenViews: "Alex and Casey chose the film together — they agreed without argument which was positive. Both wanted pizza before the film. Alex asked if Jordan could come too but Jordan had homework to finish and chose to stay home.",
    postTripEvaluation: {
      rating: 4,
      highlights: "Alex and Casey got on really well and it was a positive peer bonding experience. Alex held the door for Casey at the restaurant, unprompted. Casey tried a new pizza topping she hadn't had before.",
      concerns: "None significant. Alex was slightly restless during the quieter parts of the film but managed well.",
      wouldRepeat: true,
      childFeedback: "Alex: 'That film was class. Can we go again next week?' Casey: 'The pizza was nice. I liked sitting with Alex, he's funny.'",
    },
    status: "completed",
    notes: "Good evening out. Positive peer interaction between Alex and Casey. Diane managed both YP well solo.",
  },
];

// ── Export columns ───────────────────────────────────────────────────────────

const TRIP_EXPORT_COLS: ExportColumn<TripPlan>[] = [
  { header: "Title", accessor: (r) => r.title },
  { header: "Type", accessor: (r) => TRIP_TYPE_CONFIG[r.tripType].label },
  { header: "Destination", accessor: (r) => r.destination },
  { header: "Start Date", accessor: (r) => r.startDate },
  { header: "End Date", accessor: (r) => r.endDate },
  { header: "Status", accessor: (r) => STATUS_CONFIG[r.status].label },
  { header: "Young People", accessor: (r) => r.youngPeople.map((yp) => getYPName(yp.youngPersonId)).join(", ") },
  { header: "Staff", accessor: (r) => r.staffAssigned.map((s) => getStaffName(s.staffId)).join(", ") },
  { header: "Staff Ratio", accessor: (r) => r.staffRatio },
  { header: "Risk Level", accessor: (r) => r.riskAssessment.overallRisk },
  { header: "Total Budget", accessor: (r) => `£${r.totalBudget}` },
  { header: "Transport", accessor: (r) => r.transport },
  { header: "Manager Approved", accessor: (r) => r.managerApproval ? "Yes" : "No" },
];

// ── Star Rating ──────────────────────────────────────────────────────────────

function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={cn("text-sm", n <= rating ? "text-amber-400" : "text-slate-200")}>
          ★
        </span>
      ))}
    </span>
  );
}

// ── Trip Card ────────────────────────────────────────────────────────────────

function TripCard({ trip }: { trip: TripPlan }) {
  const [expanded, setExpanded] = useState(false);
  const typeCfg = TRIP_TYPE_CONFIG[trip.tripType];
  const statusCfg = STATUS_CONFIG[trip.status];
  const riskCfg = RISK_CONFIG[trip.riskAssessment.overallRisk];

  const daysUntil = useMemo(() => {
    const diff = Math.ceil((new Date(trip.startDate).getTime() - Date.now()) / 86400000);
    return diff;
  }, [trip.startDate]);

  const budgetActual = trip.budget.reduce((s, b) => s + (b.actual ?? 0), 0);
  const budgetEstimated = trip.budget.reduce((s, b) => s + b.estimated, 0);
  const allConsent = trip.youngPeople.every((yp) => yp.consentObtained);
  const allSWApproved = trip.socialWorkerApproval.every((a) => a.approved);

  return (
    <div className="rounded-2xl border bg-white overflow-hidden border-slate-200 transition-all hover:shadow-sm">
      {/* ── Card header ─────────────────────────────────────────────── */}
      <div className="flex items-start gap-3 p-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-slate-100">
          <MapPin className="h-4 w-4 text-slate-600" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-sm font-bold text-slate-800">{trip.title}</span>
            {daysUntil > 0 && daysUntil <= 14 && trip.status !== "completed" && trip.status !== "cancelled" && (
              <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-amber-50 text-amber-700 border-amber-200">
                <Clock className="h-2.5 w-2.5 mr-0.5 inline" />{daysUntil}d away
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {trip.startDate === trip.endDate ? trip.startDate : `${trip.startDate} — ${trip.endDate}`}
            </span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {trip.destination}
            </span>
            <span>·</span>
            <span>{trip.departureTime} — {trip.returnTime}</span>
          </div>

          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 border", typeCfg.cls)}>
              {typeCfg.label}
            </Badge>
            <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 border", statusCfg.cls)}>
              {statusCfg.label}
            </Badge>
            <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 border", riskCfg.cls)}>
              Risk: {riskCfg.label}
            </Badge>
            {!allConsent && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-red-50 text-red-700 border-red-200">
                <AlertTriangle className="h-2.5 w-2.5 mr-0.5 inline" />Consent pending
              </Badge>
            )}
          </div>
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="text-slate-400 hover:text-slate-600 shrink-0"
        >
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {/* ── Expanded content ────────────────────────────────────────── */}
      {expanded && (
        <div className="border-t border-slate-100 px-4 pb-4 pt-3 space-y-4">

          {/* Young People attending */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">Young People Attending</p>
            <div className="space-y-1.5">
              {trip.youngPeople.map((yp) => (
                <div key={yp.youngPersonId} className="flex items-center gap-2 text-xs">
                  <span className="font-medium text-slate-700 w-24">{getYPName(yp.youngPersonId)}</span>
                  {yp.consentObtained ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                  ) : (
                    <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
                  )}
                  <span className={cn("text-[10px]", yp.consentObtained ? "text-green-600" : "text-red-600")}>
                    {yp.consentObtained ? `Consent: ${yp.consentFrom}` : "Consent pending"}
                  </span>
                  {yp.medicalInfoShared && (
                    <Badge variant="outline" className="text-[9px] px-1 py-0 bg-blue-50 text-blue-600 border-blue-200">Med</Badge>
                  )}
                  {yp.behaviourPlanShared && (
                    <Badge variant="outline" className="text-[9px] px-1 py-0 bg-violet-50 text-violet-600 border-violet-200">BP</Badge>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Staff assigned */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">Staff Assigned — Ratio {trip.staffRatio}</p>
            <div className="space-y-1">
              {trip.staffAssigned.map((s) => (
                <div key={s.staffId} className="flex items-center gap-2 text-xs">
                  <span className="font-medium text-slate-700">{getStaffName(s.staffId)}</span>
                  <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-slate-100 text-slate-600 border-slate-200 capitalize">{s.role}</Badge>
                  {s.sleepIn && (
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-indigo-50 text-indigo-600 border-indigo-200">Sleep-in</Badge>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Risk Assessment */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Risk Assessment</p>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 border", riskCfg.cls)}>
                  {riskCfg.label} Risk
                </Badge>
                {trip.riskAssessment.completed ? (
                  <span className="text-[10px] text-green-600 flex items-center gap-0.5">
                    <CheckCircle2 className="h-3 w-3" />Completed
                  </span>
                ) : (
                  <span className="text-[10px] text-red-600 flex items-center gap-0.5">
                    <AlertTriangle className="h-3 w-3" />Incomplete
                  </span>
                )}
              </div>
            </div>
            {trip.riskAssessment.completedBy && (
              <p className="text-[10px] text-slate-400 mb-2">
                Completed by {getStaffName(trip.riskAssessment.completedBy)} on {trip.riskAssessment.completedDate}
              </p>
            )}
            <div className="space-y-2">
              {trip.riskAssessment.hazards.map((h, i) => (
                <div key={i} className="rounded-lg border border-slate-200 bg-white p-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-semibold text-slate-700">{h.hazard}</span>
                    <span className="text-[9px] text-slate-400">L:{h.likelihood} × I:{h.impact} = {h.likelihood * h.impact}</span>
                  </div>
                  <p className="text-[10px] text-slate-500">{h.controls}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Itinerary timeline */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">Itinerary</p>
            <div className="relative pl-4 border-l-2 border-slate-200 space-y-3">
              {trip.itinerary.map((item, i) => (
                <div key={i} className="relative">
                  <div className="absolute -left-[21px] top-0.5 w-3 h-3 rounded-full bg-white border-2 border-slate-300" />
                  <div className="text-xs">
                    <span className="font-bold text-slate-700">{item.time}</span>
                    <span className="mx-1.5 text-slate-300">—</span>
                    <span className="font-medium text-slate-700">{item.activity}</span>
                    {item.location && (
                      <span className="text-slate-400 ml-1">@ {item.location}</span>
                    )}
                  </div>
                  {item.notes && (
                    <p className="text-[10px] text-slate-400 mt-0.5">{item.notes}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Budget table */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">Budget — £{trip.totalBudget} total</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-1 text-[10px] font-semibold text-slate-500">Item</th>
                    <th className="text-right py-1 text-[10px] font-semibold text-slate-500">Estimated</th>
                    <th className="text-right py-1 text-[10px] font-semibold text-slate-500">Actual</th>
                  </tr>
                </thead>
                <tbody>
                  {trip.budget.map((b, i) => (
                    <tr key={i} className="border-b border-slate-100 last:border-0">
                      <td className="py-1 text-slate-700">{b.item}</td>
                      <td className="py-1 text-right text-slate-600">£{b.estimated}</td>
                      <td className="py-1 text-right text-slate-600">{b.actual !== null ? `£${b.actual}` : "—"}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-slate-300">
                    <td className="py-1 font-semibold text-slate-700">Total</td>
                    <td className="py-1 text-right font-semibold text-slate-700">£{budgetEstimated}</td>
                    <td className="py-1 text-right font-semibold text-slate-700">
                      {trip.budget.some((b) => b.actual !== null) ? `£${budgetActual}` : "—"}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Approvals */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">Approvals</p>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs">
                {trip.managerApproval ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                ) : (
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                )}
                <span className="text-slate-700">
                  Manager approval: {trip.managerApproval
                    ? `Approved by ${trip.managerApprovedBy ? getStaffName(trip.managerApprovedBy) : "—"}`
                    : "Pending"}
                </span>
              </div>
              {trip.socialWorkerApproval.map((sw) => (
                <div key={sw.youngPersonId} className="flex items-center gap-2 text-xs">
                  {sw.approved ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                  ) : (
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                  )}
                  <span className="text-slate-700">
                    SW for {getYPName(sw.youngPersonId)}: {sw.approved ? `Approved ${sw.approvedDate}` : "Pending"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Children's views — pink panel */}
          {trip.childrenViews && (
            <div className="rounded-xl border border-pink-100 bg-pink-50/40 p-3">
              <p className="text-[10px] font-semibold text-pink-700 uppercase tracking-widest mb-1">Children&apos;s Views</p>
              <p className="text-xs text-slate-700 leading-relaxed">{trip.childrenViews}</p>
            </div>
          )}

          {/* Post-trip evaluation — green panel */}
          {trip.postTripEvaluation && (
            <div className="rounded-xl border border-green-100 bg-green-50/40 p-3">
              <div className="flex items-center gap-2 mb-2">
                <p className="text-[10px] font-semibold text-green-700 uppercase tracking-widest">Post-Trip Evaluation</p>
                <Stars rating={trip.postTripEvaluation.rating} />
              </div>
              <div className="space-y-2 text-xs text-slate-700 leading-relaxed">
                <div>
                  <span className="font-semibold text-green-700">Highlights: </span>
                  {trip.postTripEvaluation.highlights}
                </div>
                {trip.postTripEvaluation.concerns && (
                  <div>
                    <span className="font-semibold text-amber-700">Concerns: </span>
                    {trip.postTripEvaluation.concerns}
                  </div>
                )}
                <div>
                  <span className="font-semibold text-green-700">Would repeat: </span>
                  {trip.postTripEvaluation.wouldRepeat ? "Yes" : "No"}
                </div>
                <div className="rounded-lg border border-green-200 bg-white/60 p-2 mt-1">
                  <p className="text-[10px] font-semibold text-green-600 uppercase tracking-widest mb-0.5">Child Feedback</p>
                  <p className="text-xs text-slate-700 italic">{trip.postTripEvaluation.childFeedback}</p>
                </div>
              </div>
            </div>
          )}

          {/* Emergency plan */}
          <div className="rounded-xl border border-orange-100 bg-orange-50/40 p-3">
            <p className="text-[10px] font-semibold text-orange-700 uppercase tracking-widest mb-1">Emergency Plan</p>
            <p className="text-xs text-slate-700 leading-relaxed">{trip.emergencyPlan}</p>
          </div>

          {/* Notes */}
          {trip.notes && (
            <div className="text-[10px] text-slate-400 px-1">
              <span className="font-semibold text-slate-500">Notes: </span>{trip.notes}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── New Trip Dialog ──────────────────────────────────────────────────────────

function NewTripDialog({
  open,
  onClose,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: TripPlan) => void;
}) {
  const [form, setForm] = useState({
    title: "",
    tripType: "day_trip" as TripType,
    destination: "",
    startDate: "",
    endDate: "",
    departureTime: "09:00",
    returnTime: "17:00",
    transport: "Oak House minibus",
    staffRatio: "1:2",
    notes: "",
    childrenViews: "",
    emergencyPlan: "",
  });

  const handleSave = () => {
    if (!form.title.trim() || !form.destination.trim() || !form.startDate) return;
    const newTrip: TripPlan = {
      id: `trip_${Date.now()}`,
      title: form.title,
      tripType: form.tripType,
      destination: form.destination,
      startDate: form.startDate,
      endDate: form.endDate || form.startDate,
      departureTime: form.departureTime,
      returnTime: form.returnTime,
      youngPeople: [],
      staffAssigned: [],
      staffRatio: form.staffRatio,
      riskAssessment: {
        completed: false,
        completedBy: null,
        completedDate: null,
        overallRisk: "low",
        hazards: [],
      },
      itinerary: [],
      budget: [],
      totalBudget: 0,
      transport: form.transport,
      accommodation: null,
      emergencyPlan: form.emergencyPlan,
      socialWorkerApproval: [],
      managerApproval: false,
      managerApprovedBy: null,
      childrenViews: form.childrenViews,
      postTripEvaluation: null,
      status: "planning",
      notes: form.notes,
    };
    onSave(newTrip);
    onClose();
    setForm((p) => ({ ...p, title: "", destination: "", startDate: "", endDate: "", notes: "", childrenViews: "", emergencyPlan: "" }));
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <MapPin className="h-4 w-4 text-blue-600" />
            Plan New Trip
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <div>
            <label className="text-xs text-slate-500 font-medium mb-1 block">Trip title <span className="text-red-500">*</span></label>
            <Input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="e.g. Lake District Weekend" className="h-8 text-xs" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 font-medium mb-1 block">Trip type</label>
              <Select value={form.tripType} onValueChange={(v) => setForm((p) => ({ ...p, tripType: v as TripType }))}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.entries(TRIP_TYPE_CONFIG) as [TripType, { label: string }][]).map(([k, cfg]) => (
                    <SelectItem key={k} value={k} className="text-xs">{cfg.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-slate-500 font-medium mb-1 block">Transport</label>
              <Input value={form.transport} onChange={(e) => setForm((p) => ({ ...p, transport: e.target.value }))} placeholder="e.g. Oak House minibus" className="h-8 text-xs" />
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-500 font-medium mb-1 block">Destination <span className="text-red-500">*</span></label>
            <Input value={form.destination} onChange={(e) => setForm((p) => ({ ...p, destination: e.target.value }))} placeholder="e.g. Blackpool" className="h-8 text-xs" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 font-medium mb-1 block">Start date <span className="text-red-500">*</span></label>
              <Input type="date" value={form.startDate} onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))} className="h-8 text-xs" />
            </div>
            <div>
              <label className="text-xs text-slate-500 font-medium mb-1 block">End date</label>
              <Input type="date" value={form.endDate} onChange={(e) => setForm((p) => ({ ...p, endDate: e.target.value }))} className="h-8 text-xs" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-slate-500 font-medium mb-1 block">Departure</label>
              <Input type="time" value={form.departureTime} onChange={(e) => setForm((p) => ({ ...p, departureTime: e.target.value }))} className="h-8 text-xs" />
            </div>
            <div>
              <label className="text-xs text-slate-500 font-medium mb-1 block">Return</label>
              <Input type="time" value={form.returnTime} onChange={(e) => setForm((p) => ({ ...p, returnTime: e.target.value }))} className="h-8 text-xs" />
            </div>
            <div>
              <label className="text-xs text-slate-500 font-medium mb-1 block">Staff ratio</label>
              <Input value={form.staffRatio} onChange={(e) => setForm((p) => ({ ...p, staffRatio: e.target.value }))} placeholder="1:2" className="h-8 text-xs" />
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-500 font-medium mb-1 block">Children&apos;s views</label>
            <Textarea value={form.childrenViews} onChange={(e) => setForm((p) => ({ ...p, childrenViews: e.target.value }))} placeholder="What do the young people want from this trip?" rows={2} className="text-xs" />
          </div>

          <div>
            <label className="text-xs text-slate-500 font-medium mb-1 block">Emergency plan</label>
            <Textarea value={form.emergencyPlan} onChange={(e) => setForm((p) => ({ ...p, emergencyPlan: e.target.value }))} placeholder="Nearest A&E, return plan, medication arrangements..." rows={2} className="text-xs" />
          </div>

          <div>
            <label className="text-xs text-slate-500 font-medium mb-1 block">Notes</label>
            <Textarea value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} placeholder="Any additional notes..." rows={2} className="text-xs" />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={handleSave} disabled={!form.title.trim() || !form.destination.trim() || !form.startDate} className="bg-blue-600 hover:bg-blue-700 text-white">
            Create Trip Plan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function HolidayPlanningPage() {
  const [trips, setTrips] = useState<TripPlan[]>(SEED_TRIPS);
  const [showNew, setShowNew] = useState(false);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "budget" | "rating">("date");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // ── Summary stats ────────────────────────────────────────────────
  const upcomingCount = useMemo(
    () => trips.filter((t) => ["planning", "approved", "ready", "in_progress"].includes(t.status) && new Date(t.startDate) >= new Date()).length,
    [trips],
  );

  const completedThisYear = useMemo(
    () => trips.filter((t) => t.status === "completed").length,
    [trips],
  );

  const totalSpend = useMemo(
    () => trips.reduce((sum, t) => {
      const actual = t.budget.reduce((s, b) => s + (b.actual ?? 0), 0);
      return sum + (actual > 0 ? actual : 0);
    }, 0),
    [trips],
  );

  const avgRating = useMemo(() => {
    const rated = trips.filter((t) => t.postTripEvaluation);
    if (rated.length === 0) return 0;
    return +(rated.reduce((s, t) => s + (t.postTripEvaluation?.rating ?? 0), 0) / rated.length).toFixed(1);
  }, [trips]);

  // ── Upcoming trips (next 3 future trips) ─────────────────────────
  const upcomingTrips = useMemo(
    () => trips
      .filter((t) => ["planning", "approved", "ready"].includes(t.status) && new Date(t.startDate) >= new Date())
      .sort((a, b) => a.startDate.localeCompare(b.startDate))
      .slice(0, 3),
    [trips],
  );

  // ── Budget overview ──────────────────────────────────────────────
  const budgetByType = useMemo(() => {
    const map: Record<string, number> = {};
    for (const t of trips) {
      const actual = t.budget.reduce((s, b) => s + (b.actual ?? 0), 0);
      if (actual > 0) {
        map[t.tripType] = (map[t.tripType] || 0) + actual;
      }
    }
    return map;
  }, [trips]);

  const completedTrips = useMemo(() => trips.filter((t) => t.status === "completed"), [trips]);
  const avgPerTrip = completedTrips.length > 0 ? Math.round(totalSpend / completedTrips.length) : 0;

  // ── Filter + sort ────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = trips;

    if (typeFilter !== "all") list = list.filter((t) => t.tripType === typeFilter);
    if (statusFilter !== "all") list = list.filter((t) => t.status === statusFilter);

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((t) =>
        t.title.toLowerCase().includes(q) ||
        t.destination.toLowerCase().includes(q) ||
        t.youngPeople.some((yp) => getYPName(yp.youngPersonId).toLowerCase().includes(q)) ||
        t.staffAssigned.some((s) => getStaffName(s.staffId).toLowerCase().includes(q)),
      );
    }

    list = [...list].sort((a, b) => {
      switch (sortBy) {
        case "budget": return b.totalBudget - a.totalBudget;
        case "rating":
          return (b.postTripEvaluation?.rating ?? 0) - (a.postTripEvaluation?.rating ?? 0);
        default: return b.startDate.localeCompare(a.startDate);
      }
    });

    return list;
  }, [trips, typeFilter, statusFilter, search, sortBy]);

  const handleAddTrip = (data: TripPlan) => {
    setTrips((prev) => [data, ...prev]);
  };

  return (
    <PageShell
      title="Holiday & Trip Planning"
      subtitle="Planned outings, day trips, holidays, and residential trips for young people"
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={filtered} columns={TRIP_EXPORT_COLS} filename="holiday-trip-planning" />
          <PrintButton title="Holiday & Trip Planning" />
          <Button size="sm" onClick={() => setShowNew(true)} className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5 h-8 text-xs">
            <Plus className="h-3.5 w-3.5" />Plan Trip
          </Button>
        </div>
      }
    >
      <div id="holiday-planning-content" className="space-y-5 animate-fade-in">

        {/* ── Summary strip ──────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Upcoming Trips", value: upcomingCount, icon: Calendar, colour: "text-blue-600", bg: "bg-blue-50 border-blue-100" },
            { label: "Completed This Year", value: completedThisYear, icon: CheckCircle2, colour: "text-green-600", bg: "bg-green-50 border-green-100" },
            { label: "Total Spend", value: `£${totalSpend}`, icon: MapPin, colour: "text-purple-600", bg: "bg-purple-50 border-purple-100" },
            { label: "Avg Rating", value: avgRating > 0 ? `${avgRating} ★` : "—", icon: Clock, colour: "text-amber-600", bg: "bg-amber-50 border-amber-100" },
          ].map(({ label, value, icon: Icon, colour, bg }) => (
            <div key={label} className={cn("rounded-2xl border p-4 text-center", bg)}>
              <Icon className={cn("h-4 w-4 mx-auto mb-1", colour)} />
              <div className={cn("text-2xl font-bold tabular-nums", colour)}>{value}</div>
              <div className="text-[10px] text-slate-500 mt-0.5 font-medium">{label}</div>
            </div>
          ))}
        </div>

        {/* ── Upcoming trips timeline ────────────────────────────────── */}
        {upcomingTrips.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-600" />
                Upcoming Trips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingTrips.map((trip) => {
                  const daysAway = Math.ceil((new Date(trip.startDate).getTime() - Date.now()) / 86400000);
                  const statusCfg = STATUS_CONFIG[trip.status];
                  const allApproved = trip.managerApproval && trip.socialWorkerApproval.every((a) => a.approved);
                  const allConsent = trip.youngPeople.every((yp) => yp.consentObtained);

                  return (
                    <div key={trip.id} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
                      <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex flex-col items-center justify-center shrink-0">
                        <span className="text-lg font-bold text-blue-700 leading-none">{daysAway}</span>
                        <span className="text-[9px] text-blue-500 font-medium">days</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-slate-800">{trip.title}</span>
                          <Badge variant="outline" className={cn("text-[9px] px-1.5 py-0 border", statusCfg.cls)}>
                            {statusCfg.label}
                          </Badge>
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {trip.destination} — {trip.startDate}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {allApproved ? (
                            <span className="text-[10px] text-green-600 flex items-center gap-0.5">
                              <CheckCircle2 className="h-3 w-3" />All approved
                            </span>
                          ) : (
                            <span className="text-[10px] text-amber-600 flex items-center gap-0.5">
                              <AlertTriangle className="h-3 w-3" />Approvals pending
                            </span>
                          )}
                          {allConsent ? (
                            <span className="text-[10px] text-green-600 flex items-center gap-0.5">
                              <CheckCircle2 className="h-3 w-3" />Consent complete
                            </span>
                          ) : (
                            <span className="text-[10px] text-red-600 flex items-center gap-0.5">
                              <AlertTriangle className="h-3 w-3" />Consent pending
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Filter bar ────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search trips, destinations, staff, YP..." className="pl-9 h-8 text-xs" />
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-slate-400" />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] text-slate-700 focus:border-blue-300 focus:ring-1 focus:ring-blue-200 outline-none"
              >
                <option value="all">All trip types</option>
                {(Object.entries(TRIP_TYPE_CONFIG) as [TripType, { label: string }][]).map(([k, cfg]) => (
                  <option key={k} value={k}>{cfg.label}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] text-slate-700 focus:border-blue-300 focus:ring-1 focus:ring-blue-200 outline-none"
              >
                <option value="all">All statuses</option>
                {(Object.entries(STATUS_CONFIG) as [TripStatus, { label: string }][]).map(([k, cfg]) => (
                  <option key={k} value={k}>{cfg.label}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-1.5">
              <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] text-slate-700 focus:border-blue-300 focus:ring-1 focus:ring-blue-200 outline-none"
              >
                <option value="date">Date (newest)</option>
                <option value="budget">Budget (highest)</option>
                <option value="rating">Rating (highest)</option>
              </select>
            </div>
          </div>
        </div>

        {(search || typeFilter !== "all" || statusFilter !== "all") && (
          <p className="text-xs text-slate-400">
            {filtered.length} result{filtered.length !== 1 ? "s" : ""}
            {search && <span> matching &ldquo;{search}&rdquo;</span>}
          </p>
        )}

        {/* ── Trip cards ─────────────────────────────────────────────── */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <MapPin className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-medium">
              {search ? `No trips match "${search}"` : "No trips planned yet"}
            </p>
            <p className="text-xs text-slate-400 mt-1">Plan a trip to start building your enrichment evidence.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        )}

        {/* ── Budget overview card ───────────────────────────────────── */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-slate-700">Budget Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-3">
              <div className="text-center">
                <div className="text-lg font-bold text-purple-600">£{totalSpend}</div>
                <div className="text-[10px] text-slate-500">Total Spent</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-blue-600">£{avgPerTrip}</div>
                <div className="text-[10px] text-slate-500">Avg Per Trip</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">{completedTrips.length}</div>
                <div className="text-[10px] text-slate-500">Trips Completed</div>
              </div>
            </div>
            {Object.keys(budgetByType).length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Spend by Type</p>
                {(Object.entries(budgetByType) as [TripType, number][]).map(([type, amount]) => (
                  <div key={type} className="flex items-center justify-between text-xs">
                    <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 border", TRIP_TYPE_CONFIG[type]?.cls)}>
                      {TRIP_TYPE_CONFIG[type]?.label ?? type}
                    </Badge>
                    <span className="font-medium text-slate-700">£{amount}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Regulatory note ────────────────────────────────────────── */}
        <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-xs text-slate-500">
          <span className="font-semibold text-slate-600">Regulatory Basis — </span>
          Children&apos;s Homes (England) Regulations 2015, Regulation 13 (Engagement in Activities):
          The registered person must promote opportunities for each child to engage in and benefit from
          a range of activities. All trips and holidays for looked-after children require social worker
          consent (Regulation 5, Delegated Authority). Risk assessments must be completed for all outings.
          Staffing ratios should be determined by the individual needs of the young people, the nature
          of the activity, and the location. Post-trip evaluations and children&apos;s views evidence
          child-centred practice and feed into care planning.
        </div>
      </div>

      <NewTripDialog
        open={showNew}
        onClose={() => setShowNew(false)}
        onSave={handleAddTrip}
      />
    </PageShell>
  );
}
