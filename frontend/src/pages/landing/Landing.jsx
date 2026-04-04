import React, { useEffect, useState } from "react";
import { ImageWithFallback } from "@/components/ImagewithFallback";
import {
  Calendar,
  Users,
  TrendingUp,
  Shield,
  Zap,
  Globe,
  Boxes,
  Bot,
  MessageSquare,
  Video,
  Sparkles,
  Headset,
} from "lucide-react";
import EventCard from "@/components/event/EventCard";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import PublicNavbar from "@/components/navbar/PublicNavbar";

const Landing = () => {
  const [liveEvents, setLiveEvents] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await api("/events/published");

        const events = res.data || res.events || [];

        const live = events.filter((e) => e.status === "live");
        const upcoming = events.filter((e) => e.status === "published");

        setLiveEvents(live);
        setUpcomingEvents(upcoming);
      } catch (err) {
        console.error("Failed to fetch events", err);
      }
    };

    fetchEvents();
  }, []);

  const features = [
    {
      icon: Boxes,
      title: "Immersive 3D Virtual Spaces",
      description:
        "Experience events in stunning 3D environments built with Three.js technology",
    },
    {
      icon: Bot,
      title: "AI-Powered Chatbot",
      description:
        "Get instant help navigating events, finding stalls, and accessing information",
    },
    {
      icon: Video,
      title: "Interactive Virtual Booths",
      description:
        "Visit exhibitor stalls in 3D space and interact with content in real-time",
    },
    {
      icon: Users,
      title: "Multi-Role Platform",
      description:
        "Attend, speak, and host events all from one unified dashboard",
    },
    {
      icon: TrendingUp,
      title: "Advanced Analytics",
      description:
        "Track engagement, attendance, and performance with powerful insights",
    },
    {
      icon: Shield,
      title: "Secure & Reliable",
      description:
        "Enterprise-grade security to protect your virtual events and data",
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      {/* <nav className="border-b border-gray-200 bg-white">
        <div className=" px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <span className="text-gray-900 font-bold text-xl">
                OPEN HOUSE
              </span>
            </div>
            <div
              className="hidden md:flex items-center gap-12 font-normal
            "
            >
              <Link
                to="/browseevents"
                className="relative text-gray-700 transition-colors duration-300 group"
              >
                Browse Events
                <span className="absolute left-1/2 bottom-0 w-0 h-[1px] bg-gray-700 transition-all duration-300 -translate-x-1/2 group-hover:w-full"></span>
              </Link>
              <a
                href="#features"
                className="relative text-gray-700 transition-colors duration-300 group"
              >
                About
                <span className="absolute left-1/2 bottom-0 w-0 h-[1px] bg-gray-700 transition-all duration-300 -translate-x-1/2 group-hover:w-full"></span>
              </a>
              <a
                href="#contact"
                className="relative text-gray-700 transition-colors duration-300 group"
              >
                Contact
                <span className="absolute left-1/2 bottom-0 w-0 h-[1px] bg-gray-700 transition-all duration-300 -translate-x-1/2 group-hover:w-full"></span>
              </a>
            </div>
            <div className="flex items-center gap-4">
              <Link
                to="/login"
                className="text-gray-700 hover:text-gray-900 border border-gray-300 px-5 py-2 rounded-lg font-medium"
              >
                Log in
              </Link>
              <Link
                to="/register"
                className="bg-black text-white px-5 py-2 rounded-lg hover:bg-gray-800 font-medium"
              >
                Register
              </Link>
            </div>
          </div>
        </div>
      </nav> */}
      <PublicNavbar />

      {/* Hero Section */}
      <div
        className="relative bg-cover bg-center bg-no-repeat overflow-hidden min-h-screen flex items-center"
        style={{ backgroundImage: "url(/bg.png)" }}
      >
        <div className="absolute inset-0 from-blue-100/80 via-blue-50/60 to-transparent"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="bg-blue-50/70 backdrop-blur-sm rounded-2xl p-12">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Experience Open House Events — Virtually.
              </h1>
              <p className="text-lg text-gray-700 mb-8">
                Explore stalls, view projects, and interact inside immersive 3D
                event environments.
              </p>
              <Link
                to="/publicbrowseevents"
                className="inline-flex items-center gap-2 bg-black text-white px-8 py-3 rounded-full hover:bg-gray-800 font-semibold text-lg"
              >
                Explore Events
                <span>→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-gray-900 mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Powerful features designed for event organizers, participants, and
              attendees alike
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="p-6 border border-gray-200 rounded-xl hover:border-indigo-300 hover:shadow-lg transition-all"
              >
                <feature.icon className="size-12 text-indigo-600 mb-4" />
                <h3 className="text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div id="how-it-works" className="py-24  from-indigo-50 to-purple-50">
        <div className=" px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-gray-900 mb-4">
              Experience Virtual Events Like Never Before
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Our platform combines cutting-edge 3D technology with intelligent
              AI to create unforgettable event experiences
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 mb-12">
            {/* 3D Virtual Spaces */}
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="bg-indigo-100 p-4 rounded-xl inline-flex mb-6">
                <Boxes className="size-12 text-indigo-600" />
              </div>
              <h3 className="text-gray-900 mb-4">
                Immersive 3D Virtual Spaces
              </h3>
              <p className="text-gray-600 mb-6">
                Built with Three.js, our platform delivers stunning 3D
                environments where attendees can explore exhibition halls, visit
                booth stalls, and interact with content in a truly immersive
                way.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <div className="bg-indigo-100 p-1 rounded mt-1">
                    <Video className="size-4 text-indigo-600" />
                  </div>
                  <div>
                    <div className="text-gray-900">
                      Walk through virtual venues
                    </div>
                    <div className="text-gray-600">
                      Navigate freely in 3D space
                    </div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="bg-indigo-100 p-1 rounded mt-1">
                    <Users className="size-4 text-indigo-600" />
                  </div>
                  <div>
                    <div className="text-gray-900">Visit exhibitor booths</div>
                    <div className="text-gray-600">
                      Interactive stalls with rich content
                    </div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="bg-indigo-100 p-1 rounded mt-1">
                    <Sparkles className="size-4 text-indigo-600" />
                  </div>
                  <div>
                    <div className="text-gray-900">Real-time interactions</div>
                    <div className="text-gray-600">
                      Engage with products and services
                    </div>
                  </div>
                </li>
              </ul>
            </div>

            {/* AI Chatbot Assistant */}
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="bg-green-100 p-4 rounded-xl inline-flex mb-6">
                <Bot className="size-12 text-green-600" />
              </div>
              <h3 className="text-gray-900 mb-4">
                AI-Powered Chatbot Assistant
              </h3>
              <p className="text-gray-600 mb-6">
                Never get lost in a virtual event. Our intelligent chatbot helps
                you navigate 3D spaces, find exhibitor stalls, access
                information, and get answers to your questions instantly.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <div className="bg-green-100 p-1 rounded mt-1">
                    <MessageSquare className="size-4 text-green-600" />
                  </div>
                  <div>
                    <div className="text-gray-900">Smart navigation</div>
                    <div className="text-gray-600">
                      Find any booth or session instantly
                    </div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="bg-green-100 p-1 rounded mt-1">
                    <Headset className="size-4 text-green-600" />
                  </div>
                  <div>
                    <div className="text-gray-900">24/7 assistance</div>
                    <div className="text-gray-600">
                      Get help anytime during events
                    </div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="bg-green-100 p-1 rounded mt-1">
                    <Sparkles className="size-4 text-green-600" />
                  </div>
                  <div>
                    <div className="text-gray-900">
                      Personalized recommendations
                    </div>
                    <div className="text-gray-600">
                      Discover relevant exhibitors and sessions
                    </div>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          {/* Unified Dashboard */}
          <div className=" bg-[#618799] from-indigo-600 to-purple-600 rounded-2xl p-8 text-white">
            <div className="text-center max-w-3xl mx-auto">
              <h3 className="text-white mb-4">
                One Dashboard for All Your Needs
              </h3>
              <p className="text-indigo-100 mb-8">
                Whether you're attending events, speaking at sessions, or
                hosting your own virtual conferences— manage everything from a
                single, unified dashboard. Switch roles seamlessly and access
                all features in one place.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <div className="bg-white/20 backdrop-blur-sm px-6 py-3 rounded-lg">
                  <div className="text-white">Attend Events</div>
                </div>
                <div className="bg-white/20 backdrop-blur-sm px-6 py-3 rounded-lg">
                  <div className="text-white">Speak at Sessions</div>
                </div>
                <div className="bg-white/20 backdrop-blur-sm px-6 py-3 rounded-lg">
                  <div className="text-white">Host Conferences</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* LIVE EVENTS */}
      <div className="py-12 bg-white">
        <div className=" px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center mb-10">
            <div>
              <h2 className="text-gray-900 mb-2 text-2xl font-semibold">
                Live Events
              </h2>
              <p className="text-gray-600">Join events happening right now</p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-8">
            {liveEvents.length === 0 ? (
              <p className="text-gray-500">No live events right now</p>
            ) : (
              liveEvents.map((event) => (
                <EventCard key={event._id} event={event} />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Upcoming Events */}
      <div className="py-12 bg-gray-50">
        <div className=" px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h2 className="text-gray-900 mb-2">Upcoming Events</h2>
              <p className="text-gray-600">
                Discover amazing events happening soon
              </p>
            </div>
            <Link
              to="/user/dashboard"
              className="text-indigo-600 hover:text-indigo-700"
            >
              View All &rarr;
            </Link>
          </div>
          {/* <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {upcomingEvents.map((event) => (
              <Link
                key={event._id}
                to={`/event/${event._id}`}
                className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all"
              >
                <ImageWithFallback
                  src={event.thumbnailUrl || "/bg.png"}
                  alt={event.name}
                  className="w-full h-48 object-cover"
                />
                <div className="p-6">
                  <div className="text-indigo-600 mb-2">{event.eventType}</div>
                  <h3 className="text-gray-900 mb-2">{event.name}</h3>
                  <div className="flex items-center gap-2 text-gray-600 mb-2">
                    <Calendar className="size-4" />
                    <span>{new Date(event.liveDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Users className="size-4" />
                    <span>{event.numberOfStalls} stalls</span>
                  </div>
                </div>
              </Link>
            ))}
          </div> */}

          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-8">
            {upcomingEvents.length === 0 ? (
              <p className="text-gray-500">No upcoming events</p>
            ) : (
              upcomingEvents.map((event) => (
                <EventCard key={event._id} event={event} />
              ))
            )}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-24 bg-indigo-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-white mb-4">
            Ready to Create Amazing Virtual Events?
          </h2>
          <p className="text-indigo-100 mb-8">
            Join thousands of event organizers creating immersive 3D experiences
            with EventHub
          </p>
          <Link
            to="/register"
            className="bg-white text-indigo-600 px-8 py-3 rounded-lg hover:bg-gray-100 inline-block"
          >
            Get Started Free
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer id="contact" className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="size-6" />
                <span>EventHub</span>
              </div>
              <p className="text-gray-400">
                Immersive virtual event platform powered by 3D technology and AI
                assistance
              </p>
            </div>
            <div>
              <h4 className="mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#features" className="hover:text-white">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#how-it-works" className="hover:text-white">
                    How It Works
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Security
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Careers
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Contact
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Privacy
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            &copy; 2025 EventHub. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
