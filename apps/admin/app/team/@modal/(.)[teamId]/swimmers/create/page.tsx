import { UploadIcon, CalendarDaysIcon } from "lucide-react";
import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@project-aqua/ui/components/dialog";
import { Label } from "@project-aqua/ui/components/label";
import { Input } from "@project-aqua/ui/components/input";
import { Button } from "@project-aqua/ui/components/button";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@project-aqua/ui/components/avatar";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@project-aqua/ui/components/select";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@project-aqua/ui/components/popover";
import { Calendar } from "@project-aqua/ui/components/calendar";

import { Modal } from "./modal";

export default function AthleteModal() {
  return (
    <Modal>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add Swimmer</DialogTitle>
          <DialogDescription>
            Fill out the form to add a new swimmer to the team.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-row items-center space-x-2">
              <Avatar className="h-16 w-16">
                <AvatarImage alt="Avatar" src="/placeholder-avatar.jpg" />
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>
              <Button variant="outline">
                <UploadIcon className="mr-2 h-4 w-4" />
                Upload Image
              </Button>
            </div>
            <div className="space-y-2">
              <Label htmlFor="first-name">First Name</Label>
              <Input id="first-name" placeholder="Enter first name" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="middle-name">Middle Name</Label>
              <Input id="middle-name" placeholder="Enter middle name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last-name">Last Name</Label>
              <Input id="last-name" placeholder="Enter last name" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="preferred-name">Preferred Name</Label>
              <Input id="preferred-name" placeholder="Enter preferred name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone-number">Phone Number</Label>
              <Input id="phone-number" placeholder="Enter phone number" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="birthday">Birthday</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    className="w-full justify-start text-left font-normal"
                    variant="outline"
                  >
                    <CalendarDaysIcon className="mr-1 h-4 w-4 -translate-x-1" />
                    <span id="birthday">Select date</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-auto p-0">
                  <Calendar initialFocus mode="single" />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date-joined">Date Joined</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    className="w-full justify-start text-left font-normal"
                    variant="outline"
                  >
                    <CalendarDaysIcon className="mr-1 h-4 w-4 -translate-x-1" />
                    <span id="date-joined">Select date</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-auto p-0">
                  <Calendar initialFocus mode="single" />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <div className="border-t pt-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Primary Contact</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="parent-name">Parent/Guardian Name</Label>
                  <Input id="parent-name" placeholder="Enter name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="relationship">Relationship to Swimmer</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Enter relationship" />
                    </SelectTrigger>
                    <SelectContent id="relationship">
                      <SelectItem value="parent">Parent</SelectItem>
                      <SelectItem value="guardian">Guardian</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="parent-phone">Phone Number</Label>
                  <Input id="parent-phone" placeholder="Enter phone number" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="parent-email">Email Address</Label>
                  <Input
                    id="parent-email"
                    placeholder="Enter email"
                    type="email"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button type="submit">Add Swimmer</Button>
        </DialogFooter>
      </DialogContent>
    </Modal>
  );
}
