/**
 * Says, unmissably, that this copy saves nothing.
 *
 * There are two deployments of this interface and they look identical: the live one on
 * Vercel with a database behind it, and a static demonstration build on GitHub Pages
 * with no server at all. On the static one every action is answered from bundled sample
 * data and anything typed is kept only in that browser.
 *
 * A small "Demo mode" chip in the top bar was not enough — it sits among other chips, its
 * explanation is a tooltip nobody hovers, and it was read straight past. Someone
 * comparing the two by eye cannot tell them apart, and the failure is silent: the
 * interface accepts the work and discards it.
 *
 * So this is a band across the top, in a colour used nowhere else, that states the
 * consequence rather than the state. "Demo mode" describes a setting; "nothing you enter
 * here is saved" describes what will happen to your afternoon.
 */
export function DemoBanner() {
  return (
    <div
      role="status"
      style={{
        background: '#7A2E0E',
        color: '#fff',
        padding: '9px 20px',
        fontSize: 13,
        fontWeight: 600,
        lineHeight: 1.45,
        display: 'flex',
        gap: 10,
        alignItems: 'baseline',
        flexWrap: 'wrap',
      }}
    >
      <span>Demonstration build — nothing you enter here is saved.</span>
      <span style={{ fontWeight: 400, opacity: 0.9 }}>
        There is no server behind this copy. Figures come from a bundled sample set, and changes last only until you
        close the tab. The live system is the deployment with a database connected.
      </span>
    </div>
  );
}
