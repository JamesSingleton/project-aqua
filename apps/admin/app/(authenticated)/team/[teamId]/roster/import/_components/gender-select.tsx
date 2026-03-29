import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@project-aqua/design-system/components/ui/select";

export function GenderSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <Select onValueChange={onChange} value={value}>
      <SelectTrigger className="h-8 w-32 text-sm">
        <SelectValue placeholder="Gender" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All genders</SelectItem>
        <SelectItem value="M">Male</SelectItem>
        <SelectItem value="F">Female</SelectItem>
      </SelectContent>
    </Select>
  );
}
