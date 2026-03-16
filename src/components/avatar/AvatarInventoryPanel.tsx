import SectionCard from "../SectionCard";
import type { AvatarInventoryDto } from "../../api/avatar";

type AvatarInventoryPanelProps = {
  inventory: AvatarInventoryDto | null;
};

export default function AvatarInventoryPanel({ inventory }: AvatarInventoryPanelProps) {
  return (
    <SectionCard
      title="Unlock roadmap"
      description="Base Ready Player Me cosmetics are available now. Progression-linked rewards can plug into this panel later."
    >
      <div className="stack-sm">
        <div className="mini-panel">
          <strong>Current policy</strong>
          <p className="section-card-copy">
            Only the standard Ready Player Me catalog is enabled for the MVP.
          </p>
        </div>

        <div className="mini-panel">
          <strong>Unlocked cosmetics</strong>
          <p className="section-card-copy">
            {inventory?.unlockedItems.length
              ? `${inventory.unlockedItems.length} cosmetic item(s) stored for this user.`
              : "No app-specific cosmetic rewards unlocked yet. Clothing rewards will appear here once session rules are met."}
          </p>
        </div>

        <div className="mini-panel">
          <strong>Future unlock sources</strong>
          <p className="section-card-copy">
            {(inventory?.futureSources ?? []).join(" · ")}
          </p>
        </div>
      </div>
    </SectionCard>
  );
}
