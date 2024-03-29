"use client";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@repo/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CreateTeamSchema = z.object({
  teamAbbreviation: z.string().min(2).max(10),
  fullTeamName: z.string().min(2).max(50),
  shortTeamName: z.string().min(2).max(20),
  teamRegistrationCode: z.string().min(2).max(20),
  teamType: z.string().min(2).max(20),
  division: z.string().min(2).max(20),
  logo: z.string().min(2).max(20),
  mailingAddress: z.string().min(2).max(50),
  mailingCity: z.string().min(2).max(20),
  mailingState: z.string().min(2).max(20),
  mailingZip: z.string().min(2).max(20),
  mailingCountry: z.string().min(2).max(20),
  contactName: z.string().min(2).max(20),
  contactEmail: z.string().email(),
  contactPhone: z.string().min(2).max(20),
});

export default function CreateTeam() {
  const form = useForm<z.infer<typeof CreateTeamSchema>>({
    resolver: zodResolver(CreateTeamSchema),
  });

  function onSubmit(data: z.infer<typeof CreateTeamSchema>) {
    console.log(data);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="teamAbbreviation"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Team Abbreviation</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormDescription>The abbreviation for your team.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="fullTeamName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Team Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormDescription>The full name of your team.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="shortTeamName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Short Team Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormDescription>The short name of your team.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="teamRegistrationCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Team Registration</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a registration" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="uss">United States Swimming</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                The registration code for your team.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="teamType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Team Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a team type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="AGE">Age Group</SelectItem>
                  <SelectItem value="COL">College</SelectItem>
                  <SelectItem value="HS">High School</SelectItem>
                  <SelectItem value="MAS">Masters</SelectItem>
                  <SelectItem value="OTH">Other</SelectItem>
                  <SelectItem value="REC">Recreation</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>The type of your team.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="division"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Division</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a division" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="varsity">Varsity</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>The division of your team.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* TODO: Add mailing and contact info */}
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  );
}
