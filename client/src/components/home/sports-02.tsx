import {
  Widget,
  WidgetContent,
  WidgetFooter,
  WidgetHeader,
  WidgetTitle,
} from "#/components/ui/widget.tsx";
import { Label } from "#/components/ui/label.tsx";
import { Badge } from "#/components/ui/badge.tsx";

export default function Sport() {
  return (
    <Widget design="mumbai">
      <WidgetHeader>
        <WidgetTitle className="text-muted-foreground flex items-center gap-1 text-sm font-normal">
          <div className="bg-green-500 size-2 rounded-full" />
          Live
        </WidgetTitle>
      </WidgetHeader>
      <WidgetContent className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <div className="me-auto flex flex-col items-center gap-2">
          <img
            className="size-9"
            src="https://upload.wikimedia.org/wikipedia/en/thumb/e/eb/Manchester_City_FC_badge.svg/250px-Manchester_City_FC_badge.svg.png"
            alt="Man City"
            width={40}
            height={40}
          />
          <Label className="text-3xl">4</Label>
        </div>
        <Badge className="animate-pulse text-sm" variant="secondary">
          34'
        </Badge>
        <div className="ms-auto flex flex-col items-center gap-2">
          <img
            className="size-9"
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/FC_Bayern_M%C3%BCnchen_logo_%282024%29.svg/250px-FC_Bayern_M%C3%BCnchen_logo_%282024%29.svg.png"
            alt="Bayern"
            width={40}
            height={40}
          />
          <Label className="text-3xl">4</Label>
        </div>
      </WidgetContent>
      <WidgetFooter className="justify-center">
        <Label className="text-muted-foreground">UCL Final</Label>
      </WidgetFooter>
    </Widget>
  );
}
