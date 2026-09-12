import { useState } from "react";

export function BeforeAfterSlider() {
  const [position, setPosition] = useState(55);
  return (
    <div className="cinematic-slider" style={{ "--slider-position": `${position}%` } as React.CSSProperties}>
      <div className="cinematic-slider-pane">
        <div className="after-mock">
          <div className="mock-top"><b>Marlow &amp; Sons</b><span>Custom cabinetry · Houston</span></div>
          <h3>Kitchens that look like<br />they were <em>always there.</em></h3>
          <p>A crafted digital direction for a fictional Houston cabinetry studio.</p>
          <span className="mock-pill">See recent kitchens →</span>
          <div className="mock-strip"><span>Approach<b>Made to measure</b></span><span>Focus<b>Craft &amp; detail</b></span><span>Next step<b>Book a consult</b></span></div>
        </div>
      </div>
      <div className="cinematic-slider-pane cinematic-slider-before">
        <div className="before-mock">
          <div className="old-bar"><span>Welcome to our Website!!</span><span>Home &nbsp; About &nbsp; Services</span></div>
          <div className="old-head"><b>Marlow &amp; Sons Custom Cabinetry</b><small>Serving the greater Houston area — Call today!</small></div>
          <div className="old-copy"><h3>Welcome!</h3><p>We are a family owned and operated business specializing in custom cabinets, kitchens, bathrooms, closets, and much more.</p><aside>Get a Quote<br /><br />Hours: Mon–Fri</aside></div>
          <div className="old-ticker">★ Custom work for Houston homes ★</div>
        </div>
      </div>
      <div className="cinematic-slider-handle" aria-hidden="true" />
      <span className="cinematic-slider-label left">Before</span>
      <span className="cinematic-slider-label right">After</span>
      <span className="cinematic-slider-disclaimer">Illustration — not a client</span>
      <input type="range" min="8" max="92" value={position} onChange={(event) => setPosition(Number(event.target.value))} aria-label="Drag to compare the website before and after the redesign" />
    </div>
  );
}