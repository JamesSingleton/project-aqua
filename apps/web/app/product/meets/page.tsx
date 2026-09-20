import type { Metadata } from "next";
import { FeatureBlock, FeaturePage } from "@/components/feature-page";
import { ProductShot } from "@/components/product-shot";

export const metadata: Metadata = {
  title: "Meets and entries",
  description:
    "Import the event file, mark who’s going, export HY3, CL2, or SDIF, print paper reports, and bring results back next to last best and the cut.",
};

export default function MeetsProductPage() {
  return (
    <FeaturePage
      title="Build the lineup once."
      description="Individuals, relays, going or scratch. The file you send is that lineup — not a second copy of the team."
      shot="meets"
    >
      <ProductShot shot="entries" />
      <ProductShot shot="results" />
      <FeatureBlock title="From the event file">
        <p>
          Import EV3, HYV, XLS, or a ZIP. Sessions, events, qualifying times,
          and JV/Varsity divisions come with it. Combined swim/dive meets skip
          dive events so a swim-only team is not stuck.
        </p>
      </FeatureBlock>
      <FeatureBlock title="Building entries">
        <p>
          Mark who is attending, including relay-only swimmers. Seed times fill
          from best times; you can override. Relays take four legs plus
          alternates when the meet requires them. Pro can suggest a lineup and
          relay order given entry limits and cuts.
        </p>
        <p>
          Validation catches per-meet and per-day caps, association event caps,
          and QT misses before export. Scratch keeps the row.
        </p>
      </FeatureBlock>
      <FeatureBlock title="The file they asked for, and paper">
        <p>
          Export HY3/CL2 for Meet Manager, or SDIF for TeamUnify and SwimTopia.
          Print the individual meet entries report and a split sheet. Default
          omits relay alternates; you can include them. Split cadence is
          print-only.
        </p>
      </FeatureBlock>
      <FeatureBlock title="Results, last best, and the cut">
        <p>
          Import the results file after the meet. Each row displays the new time
          right next to their previous best, so you can see the drops without
          opening a second sheet.
        </p>
        <p>
          Toggle time standards on the same page. Pick JO, sectionals, or a set
          you imported. Under, at, or over the cut sits on the row. Faster swims
          update best times. Unmatched names stay on a review list.
        </p>
      </FeatureBlock>
    </FeaturePage>
  );
}
