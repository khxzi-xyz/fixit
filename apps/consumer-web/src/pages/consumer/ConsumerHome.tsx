import { useState } from "react";
import { Link } from "wouter";
import { ConsumerLayout } from "@/components/layouts/ConsumerLayout";
import { MapPin, Search, Star, Clock, AlertCircle, Wrench, Zap, Snowflake, Sparkles, Hammer } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const MOCK_CATEGORIES = [
  { id: 1, name: "Plumbing", icon: Wrench },
  { id: 2, name: "Electrical", icon: Zap },
  { id: 3, name: "AC Repair", icon: Snowflake },
  { id: 4, name: "Cleaning", icon: Sparkles },
  { id: 5, name: "Carpentry", icon: Hammer },
];

const MOCK_ACTIVE_JOBS = [
  { id: "101", title: "Leaking Kitchen Pipe", status: "ASSIGNED", eta: "15 mins", vendor: "Mohammed Al-Rashidi" },
  { id: "102", title: "AC Not Cooling", status: "OPEN", bids: 3 },
];

export default function ConsumerHome() {
  return (
    <ConsumerLayout>
      <div className="p-4 space-y-6">
        {/* Header & Location */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Current Location</p>
            <div className="flex items-center gap-1 font-semibold">
              <MapPin className="w-4 h-4 text-primary" />
              <span>Al Seeb, Muscat</span>
            </div>
          </div>
          <Link href="/profile">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
              MA
            </div>
          </Link>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input 
            placeholder="What do you need help with?" 
            className="pl-10 h-12 bg-card border-none rounded-xl shadow-sm text-base"
          />
        </div>

        {/* Quick Post CTA */}
        <Link href="/post-job" className="block w-full">
          <Button size="lg" className="w-full rounded-xl h-14 text-lg font-semibold bg-primary hover:bg-primary/90 shadow-[0_0_20px_rgba(27,110,243,0.3)] text-white">
            Post a Job Now
          </Button>
        </Link>

        {/* Categories Carousel */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold tracking-tight">Categories</h2>
            <Link href="/categories" className="text-sm text-primary font-medium">See All</Link>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
            {MOCK_CATEGORIES.map(cat => {
              const Icon = cat.icon;
              return (
                <div key={cat.id} className="flex-shrink-0 flex flex-col items-center gap-2">
                  <div className="w-16 h-16 bg-card border border-border rounded-2xl flex items-center justify-center shadow-sm text-primary">
                    <Icon className="w-8 h-8" />
                  </div>
                  <span className="text-xs font-medium">{cat.name}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Active Jobs */}
        <div>
          <h2 className="text-lg font-bold tracking-tight mb-3">Your Jobs</h2>
          <div className="space-y-3">
            {MOCK_ACTIVE_JOBS.map(job => (
              <Link key={job.id} href={`/order/${job.id}`}>
                <Card className="bg-card border-border hover:border-primary/50 transition-colors cursor-pointer rounded-xl">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold">{job.title}</h3>
                      <Badge variant={job.status === "OPEN" ? "secondary" : "default"} className="bg-primary/10 text-primary hover:bg-primary/20">
                        {job.status}
                      </Badge>
                    </div>
                    {job.status === "OPEN" ? (
                      <p className="text-sm text-muted-foreground">{job.bids} vendor(s) have bid on your job</p>
                    ) : (
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-3">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-accent" />
                          <span>{job.vendor}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4 text-primary" />
                          <span>ETA {job.eta}</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
        
        {/* Live Map Mock */}
        <div>
          <h2 className="text-lg font-bold tracking-tight mb-3">Providers Nearby</h2>
          <div className="relative w-full h-48 bg-muted rounded-xl overflow-hidden border border-border flex items-center justify-center">
            {/* Map styling mock */}
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at center, #1B6EF3 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
            {/* Pulsing Dots */}
            <div className="absolute top-1/4 left-1/4 w-3 h-3 bg-primary rounded-full animate-ping"></div>
            <div className="absolute top-1/2 right-1/3 w-3 h-3 bg-primary rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
            <div className="absolute bottom-1/3 left-1/2 w-3 h-3 bg-primary rounded-full animate-ping" style={{ animationDelay: '1s' }}></div>
            <div className="z-10 bg-card/80 backdrop-blur-sm px-4 py-2 rounded-full border border-border text-sm font-medium shadow-sm">
              <span className="text-primary font-bold">12</span> vendors available now
            </div>
          </div>
        </div>

      </div>
    </ConsumerLayout>
  );
}
