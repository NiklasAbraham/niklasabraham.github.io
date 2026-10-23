---
layout: default
title: The engineering of a butterfly wing. Loads, lever, spring and muscle, with numbers
description: A butterfly wing as a machine, worked through with numbers. What the wings must lift, how a lever trades muscle force for muscle stroke, why the hinge is a flexure and not a bearing, how a spring-wing system is judged by the Weis-Fogh number (about 0.4 for the large white, so the spring helps little), what a muscle work loop looks like, and whether the muscle has enough power. The animal taken apart and a thorax you can cut open in 3D, four live simulators and a 3D flight simulation in which the wings, the forces and the body motion all come from the same equations.
date: 2026-10-21
tags: [biology, biomechanics, physics, flight, insects, 3D]
image: /assets/blog-thumbs/butterfly-wing.webp
categories: [long-read]
read_time: 30 # the word count does not include the interactive figures
---
<article class="da bfa" markdown="1" data-stations="off" data-brand="Butterfly wing" data-brand-sub="loads, lever, spring, muscle · a long read" data-contact="https://www.linkedin.com/in/niklas-abraham-05983b247">

<p class="da-eyebrow">Blog · Long read · physics and engineering · the animal in 3D, 4 simulators, solved 3D flight</p>
<h1 class="da-title">The engineering of a butterfly wing</h1>
<p class="da-lede">A butterfly of 80 mg beats four wings twelve times a second, for hours, with no bearing to oil and no muscle in the wing. This is that machine worked through as an engineer would: what the air demands of the wings (force, torque, power), how a lever of half a millimetre turns a muscle's short pull into a stroke of 120 degrees, why the hinge is a spring and not a bearing, how a spring and a wing are judged by one dimensionless number, and whether the muscle has the power. Every number comes from an equation you can run and change in the figures.</p>
<p class="da-meta">Written by an AI, published by Niklas Abraham · 21 October 2026 · about 30 minutes · interactive figures</p>

<div class="da-note ai-note" markdown="1">
**This article was written by an AI.** I wondered how a butterfly's wing is moved, whether there is some kind of bearing, and how the muscle works, so I asked Claude (an AI model from Anthropic) to research, write and code this article to help me learn more. The simulators solve real equations, but with **my own order-of-magnitude parameters** for a cabbage-white-sized butterfly (80 mg, 5 cm² of wing per side, 12 Hz, ±63°): they are not measurements of an animal, and every parameter can be changed in the figure. The 3D flight simulation is driven by the same equations (a flat-plate blade-element model, a point-mass body), so its wings are drawn as plain plates and not as a butterfly. The facts about insect flight come from the sources in the [reference list](#sources) and carry tags such as <sup class="ai-ref"><a href="#r-wiki-flight">[Wikipedia flight]</a></sup>. For several of them only an abstract or a search result was seen, and the list says which. Numbers that are my own estimates are marked as such. The prose may contain mistakes, so check what you rely on at its source. If you find an error, [message me on LinkedIn](https://www.linkedin.com/in/niklas-abraham-05983b247).
</div>

<nav class="da-toc" markdown="0">
<span class="lbl">Contents</span>
<ol>
<li><a href="#animal">The animal, taken apart</a></li>
<li><a href="#load">What the wings must do</a></li>
<li><a href="#where">Where the work comes from</a></li>
<li><a href="#lever">The lever: force against stroke</a></li>
<li><a href="#hinge">The hinge: why not a bearing</a></li>
<li><a href="#spring">Spring and wing: the Weis-Fogh number</a></li>
<li><a href="#muscle">The muscle: a work loop</a></li>
<li><a href="#budget">The power budget</a></li>
<li><a href="#air">What the air does in detail</a></li>
<li><a href="#limits">What the model cannot tell you</a></li>
<li><a href="#sources">Sources</a></li>
</ol>
</nav>

<p class="da-part">Part 0<strong>The animal</strong></p>

<h2 id="animal"><span class="num">00</span>The animal, taken apart</h2>

Before any equation, the machine itself. A butterfly is three body sections. The **head** carries the compound eyes, the clubbed antennae and the proboscis, and plays no part in flight. The **abdomen** holds the gut, the reproductive organs and the air sacs, carries no flight muscle and trails behind. Between them sits the **thorax**, a box of cuticle about the size of a grain of rice, and that box is the engine: it holds all the flight muscle, it carries the legs underneath and the wings on its upper edges. Everything in this article happens inside it.

The **wings are not muscular**. Each is a double membrane of cuticle held open by hollow veins, which carry blood and nerves and act as the spars, and covered on both sides with overlapping scales, flattened hairs that give the colour (pigment in the monarch and the cabbage white, a layered nanostructure that interferes with light in the blue morpho). Forewing and hindwing overlap and are coupled, so on each side they beat as one surface. A wing can only be moved from its base, which is why the whole question is about the base: the hinge and the muscles behind it.

Take the animal apart below. The model is procedural and schematic, not a scan, and the proportions are chosen, but the parts and their relations are the real ones. Pick a part by name, or click it in the picture, and switch the species to see how little the machinery changes while the paint does.

{% include bf.html kind="anatomy" id="bf-anatomy" wide=1 title="The animal, taken apart" caption="A procedural 3D butterfly (monarch, blue morpho or cabbage white pattern) with the parts moved apart along their own directions. Schematic: proportions and details are chosen, not measured. Drag to orbit, scroll to zoom, press 'Take it apart' or use the explode slider; the cuticle can be made see-through, and the wings can beat." %}

{: .da-bridge}
The rest of the article asks what the thorax has to deliver, how it does it, and where it runs out of margin.

<p class="da-part">Part I<strong>The loads</strong></p>

<h2 id="load"><span class="num">01</span>What the wings must do</h2>

Start from the requirement. The wings must, on average over a beat, push the air down with a force equal to the weight: $$\bar F = m g$$. For the reference animal of this article (80 mg, my estimate for a cabbage-white-sized butterfly) that is $$0.785\ \mathrm{mN}$$. A wing element of chord $$c$$ at radius $$r$$ that sweeps at angle rate $$\dot\theta$$ moves through the air at $$\dot\theta\, r$$, and the aerodynamic force on it is the dynamic pressure times its area times a coefficient,

$$
\mathrm{d}F = \tfrac12 \rho\, C\,(\dot\theta\, r)^2\, c\,\mathrm{d}r .
$$

For a flat plate the force is normal to the plate with coefficient $$C_N = C_{N,\max}\sin\alpha$$ at angle of attack $$\alpha$$. Resolved into a vertical lift and a horizontal drag, $$C_L = C_{N,\max}\sin\alpha\cos\alpha$$ and $$C_D = C_{N,\max}\sin^2\alpha$$. Integrating over the wing gives two geometry integrals that do all the work, the second and third moment of the wing area,

$$
\bar F = \tfrac12 \rho\, C_L\,\omega^2\varphi^2 \int c\,r^2\,\mathrm{d}r , \qquad
\tau_{\text{air}} = \Gamma\,\lvert\dot\theta\rvert\dot\theta , \quad \Gamma = \tfrac12\rho\, C_D \int c\,r^3\,\mathrm{d}r ,
$$

for a stroke $$\theta = -\varphi\cos\omega t$$ of half-amplitude $$\varphi$$ (the mean of $$\sin^2$$ is a half, and there are two wings). Three consequences are worth noting before touching the figure. Lift grows as $$f^2\varphi^2 S$$, so halving the wingbeat frequency needs twice the amplitude or four times the wing area: a large, light wing can afford a slow beat, which is why a butterfly beats at about ten per second and a bumblebee at about 180 {% include bf-ref.html k="gau2021" %}. The aerodynamic torque is quadratic in the speed, not linear, so it behaves like a drag that grows with the amplitude cubed in power. And the force is not constant: it is zero at the reversals and peaks mid-stroke at twice its mean, which the figure shows.

{% include bf.html kind="load" id="bf-load" wide=1 title="The load: vertical force of both wings over one beat against the weight" caption="Quasi-steady blade-element model of two wings, F = ½ρ C_L (dθ/dt)² ∫c r² dr, with C_L = C_N,max sin α cos α and C_N,max = 3.4 (flat plate). Defaults are my estimates for a cabbage-white-sized butterfly (see the source list). Vary the amplitude and the frequency and watch the mean lift cross the weight; the readout gives the half-amplitude that carries the weight exactly. Reynolds number is taken at the second-moment radius." %}

With the defaults the model gives a mean lift of about 85 per cent of the weight at a half-amplitude of 63 degrees; 69 degrees would carry it exactly. That is as good as a quasi-steady model gets: it leaves out the leading-edge vortex enhancement beyond a flat plate, wake capture, and the clap and fling of section 08 {% include bf-ref.html k="srygley2002" %}, each of which adds lift. The Reynolds number at the second-moment radius is about 1500 {% include bf-ref.html k="re-estimate" %}, in the range of 10 to $$10^4$$ that insect flight covers {% include bf-ref.html k="wiki-flight" %}.

{% include bf.html kind="flight" id="bf-flight" wide=1 title="The same equations in 3D: wings, forces and body motion solved together" caption="Each wing is cut into ten blade elements. The stroke is theta = -phi cos(omega t) about an axis tilted by the stroke-plane angle; every element feels dL = ½ρ C_L c u² dr normal to the stroke plane (green) and dD = ½ρ C_D c |u|u dr along the wing's velocity (orange), with u = r dtheta/dt. Wing colour is the dynamic pressure u². The body is a point mass of 80 mg that integrates the sum of these forces, its weight (red) and a quadratic body drag with C_D A = 1e-4 m² (an estimate); the camera follows it and the dots are fixed in the air. Quasi-steady: no leading-edge vortex, wake capture or clap and fling, and the body does not pitch or roll. Drag the picture to orbit." %}

At the reference values the animal sinks. The mean lift of 85 per cent of the weight leaves a net force of 0.15 weights downward, an acceleration of about $$1.5\ \mathrm{m/s^2}$$, and the height trace bends downward accordingly. The force trace above it shows the lift going to zero at each reversal and peaking at about twice its mean mid-stroke, so the body speeds up and slows down inside each beat. Press **amplitude that hovers** and the height stays within about a centimetre. Then tilt the stroke plane: the lift now has a horizontal component $$F\sin\beta$$ and the body accelerates forward until body drag balances it, while the vertical component is down by $$\cos\beta$$, so a tilted plane needs a larger amplitude to carry the weight. That is the whole mechanism of forward flight in this model; real butterflies add body pitch, which the figure leaves out.

The wing loading, weight over wing area, is only about $$0.8\ \mathrm{N/m^2}$$. That number is why the beat can be slow, and it is the first design decision: the slower the beat, the lower the inertial and aerodynamic power, and the slower the muscle may be.

{: .da-bridge}
So much for what the wings need. The next question is where in the body that force can be produced, and the answer is not in the wing.

<h2 id="where"><span class="num">02</span>Where the work comes from</h2>

Put the muscle into the wing and check what it costs. The flight muscle of a butterfly is a substantial part of its body: monarchs have between 22 and 35 per cent of their body mass in the flight muscle, depending on what they ate as larvae {% include bf-ref.html k="monarch-fmr" %}. For the reference animal take 20 per cent, 16 mg, shared by the two wings, 8 mg per wing. Moved into the wing at half its length, those 8 mg add $$8\cdot10^{-6}\ \mathrm{kg}\times(12.5\ \mathrm{mm})^2 = 1.25\cdot 10^{-9}\ \mathrm{kg\,m^2}$$ to a wing inertia of $$2.7\cdot10^{-9}$$ (section 05): 46 per cent more inertia to accelerate twenty-four times a second, and a wing that cannot be a membrane a tenth of a millimetre thick. The alternative is the arrangement almost all insects use. Dragonflies attach muscles directly to the wing bases, but butterflies and most other insects fly **indirectly**: the muscles are in the thorax, attached to its wall, and they deform it {% include bf-ref.html k="wiki-flight" %}. The wing is a lever on the side of a box that changes shape.

Two muscle sets act on the box, at right angles to each other. The **dorsoventral muscles** run from roof to floor and pull the roof down, which lifts the wing. The **dorsolongitudinal muscles** run from front to back; when they shorten, the box gets shorter and its roof arches up, and the wing goes down: this is the power stroke. Each set stretches the other as it shortens, so neither needs a return spring or a return muscle. Near the hinges the roof deforms more than elsewhere: in a hawkmoth, measured with a laser profilometer on a flying animal, the dorsal thorax deformation is locally amplified near the wing hinges {% include bf-ref.html k="ando2016" %}.

Cut the box open and the arrangement is plain. Slide the cut plane through the thorax, watch which muscle fires when, and hold the animal at any point of the beat with the phase slider.

{% include bf.html kind="thorax" id="bf-thorax" wide=1 title="The thorax cut open: two muscle sets, a roof that rocks, a hinge that bends" caption="A section through the thorax (schematic 3D). The vertical muscles (DVM) pull the roof down and the wings go up; the long muscles (DLM) arch the roof and the wings go down. The strip shows when each set is active in one beat: the activation bursts are the three-impulse pattern assumed in this article (chosen, not measured; the real timing in a free-flying tiger butterfly is in the source). Scrub the strip or the slider; drag the picture to orbit. Front, side and top views are one click away." %}

{: .da-bridge}
Between the roof and the wing sits a hinge that works as a lever. How much it amplifies is a design parameter with a trade-off, and the trade-off can be computed.

<p class="da-part">Part II<strong>The mechanism</strong></p>

<h2 id="lever"><span class="num">03</span>The lever: force against stroke</h2>

Call the distance from the fulcrum to the inner end of the wing root $$\ell_{\text{in}}$$. When the roof end moves down by $$\delta$$ the wing turns by $$\theta = \arcsin(\delta/\ell_{\text{in}})$$, so a stroke of half-amplitude $$\varphi$$ needs a roof movement $$\delta = \ell_{\text{in}}\sin\varphi$$. Torque balance about the fulcrum gives the force the muscle must exert at the roof for a wing torque $$\tau$$,

$$
F = \frac{\tau}{\ell_{\text{in}}\cos\theta} .
$$

A lever transmits work, not force: $$F\,\delta$$ is the same for every $$\ell_{\text{in}}$$, so the arm only decides how the work is split into force and stroke. A short arm means a large force over a small stroke, a long arm a small force over a large stroke. The muscle sets two limits. Its stress cannot exceed the isometric maximum, about 250 kPa for striated muscle (an assumed round number), and its strain per beat is limited to some per cent of its length. The cross-section of the muscle follows from its mass and length, $$A = V/L$$, and the stress is $$F/A$$; the strain is $$\delta/L$$.

{% include bf.html kind="transmission" id="bf-transmission" wide=1 title="The lever as a trade between muscle force and muscle stroke" caption="Left: the geometry for the chosen inner arm and stroke (the wing is drawn compressed). Right: muscle stress as a fraction of 250 kPa (red) and muscle strain as a fraction of 8 per cent (violet) against the inner arm, for the peak torque of the simulated wing with the hinge spring tuned to the beat. The green band is where both stay below their limits. The peak torque and the muscle cross-section come from the reference butterfly (80 mg, 20 per cent flight muscle)." %}

For the reference butterfly an inner arm of 0.5 mm, which gives a lever ratio of 50, needs a roof movement of 0.45 mm, a muscle strain of 5.6 per cent over an 8 mm muscle and a stress of about half the maximum. Make the arm 0.1 mm and the stroke is a tiny 1 per cent but the muscle is overloaded; make it 2 mm and the stress is low but the muscle would have to shorten by 22 per cent. The window is wide enough that evolution has room to move inside it, and narrow enough that one cannot pick the numbers freely. Two details the figure leaves out: the effective arm shrinks as $$\cos\theta$$ along the stroke, so the lever gain grows by a factor of two between the middle and the ends of a stroke of $$\pm 60^\circ$$, and the wing and thorax are not rigid, so part of the roof movement is spent bending the thorax rather than turning the wing.

{: .da-bridge}
The lever turns about a point. What is that point made of?

<h2 id="hinge"><span class="num">04</span>The hinge: why not a bearing</h2>

There is no bearing. The wing base rests on a peg of the side wall, the pleural wing process, and is held by a cluster of small hard plates, the axillary sclerites, joined by flexible cuticle and a pad of resilin, a rubber-like protein. It is a **compliant mechanism**: the plates do not slide, the flexible parts between them bend {% include bf-ref.html k="hinge-fly" %}. That choice can be checked with numbers, and the result is not what one expects.

A lubricated journal with a friction coefficient $$\mu = 0.1$$, a radius of 0.1 mm and the roof force of 65 mN from the lever calculation has a friction torque of $$\mu F r \approx 6\cdot10^{-7}\ \mathrm{N\,m}$$, about 4 per cent of the peak wing torque of $$1.5\cdot10^{-5}$$. Over a beat that is a loss of roughly $$30\ \mu\mathrm{W}$$ per wing, 7 per cent of the aerodynamic power of $$460\ \mu\mathrm{W}$$. So friction on its own is **not** what rules out a bearing. What does is less visible. Twelve beats a second for a hundred hours of flight is a few million cycles, of order $$10^6$$ to $$10^7$$, a journal at that size needs a lubricant film and leaves wear debris that the animal cannot flush, and an animal that grows its joints from cuticle at moulting has no way to build a close-tolerance journal. A flexure has no sliding surface to wear, and it stores energy as it bends. The loss in a flexure is its internal friction, written below as a loss factor $$\gamma$$ (the fraction of stored energy lost per radian of phase); the next section lets you set it.

The stiffness needed is also a number. To resonate at the wingbeat the combined hinge and thorax must give a torsional stiffness $$k = I\omega^2 = 1.6\cdot 10^{-5}\ \mathrm{N\,m/rad}$$ per wing, which at the roof, through the 0.5 mm arm, is $$k/\ell_{\text{in}}^2 \approx 60\ \mathrm{N/m}$$: a roof displacement of 0.45 mm must come with an elastic force of about 28 mN. That is the stiffness the thorax would have to supply. Whether it does is the question of the next section.

{: .da-bridge}
A hinge that stores energy turns wing and thorax into a mass on a spring. Whether that spring helps depends on a single number.

<h2 id="spring"><span class="num">05</span>Spring and wing: the Weis-Fogh number</h2>

Move the wing with a prescribed stroke $$\theta(t) = -\varphi\cos\omega t$$ and ask what torque the muscle has to apply. The wing has an inertia $$I$$, which is the wing's own plus the **added mass** of the air it drags along, the hinge a spring $$k$$ with loss, and the air a quadratic drag:

$$
\tau_{\text{muscle}} = I\,\ddot\theta + k\,\theta + \frac{k\gamma}{\omega}\,\dot\theta + \Gamma\,\lvert\dot\theta\rvert\,\dot\theta .
$$

This is the equation of the spring-wing systems of Lynch and colleagues {% include bf-ref.html k="lynch2024" %}. Their single organising number is the **Weis-Fogh number**, the ratio of the peak inertial torque to the peak aerodynamic torque,

$$
N = \frac{I}{\Gamma\,\theta_0}, \qquad \theta_0 = 2\varphi \ (\text{peak to peak}) .
$$

If $$N$$ is large, the inertial torque dominates, the muscle spends most of its effort accelerating and braking the wing, and a spring that returns that energy at resonance saves a great deal. If $$N$$ is small, the air dominates, and a spring has little to give back. With internal loss $$\gamma$$ the best possible efficiency is $$\eta = 1/(1 + \tfrac{3\pi}{8}\gamma N)$$ {% include bf-ref.html k="lynch2024" %}. Most insects have $$N$$ between 1 and 8; the paper quotes about 0.4 for the large white butterfly (*Pieris brassicae*), "also $$N<1$$", and notes that the benefit of elastic storage drops off below $$N=1$$ {% include bf-ref.html k="lynch2024" %}.

For the reference butterfly the model gives $$I = I_{\text{wing}} + I_{\text{air}} = 0.8 + 2.0 = 2.7\cdot 10^{-9}\ \mathrm{kg\,m^2}$$, **so the air's added mass is 70 per cent of the effective inertia**, $$\Gamma = 1.9\cdot 10^{-9}$$ and $$N \approx 0.66$$, the same order as the published 0.4. Run it.

{% include bf.html kind="springwing" id="bf-springwing" wide=1 title="Torques on one wing and the cost of a spring" caption="Left: the four torques over one beat for a prescribed stroke, and the muscle torque that results (black). Right: mean positive muscle power divided by the muscle power with no spring, against how the hinge is tuned (1 = resonance at the wingbeat), for the current N (solid) and two other N (dashed); below 1 the spring helps. At resonance the muscle torque equals the air torque alone: the spring carries the inertia. Set 'wing inertia' to 8× or more to see a regime where tuning pays; remove the spring to see the muscle pay for inertia on its own. 'Positive power only' because a muscle cannot store the energy it absorbs." %}

Read the figure for the reference wing. Without any spring the muscle's positive work is 21 per cent higher than the air's share, because it must also accelerate the wing. A well-tuned spring at $$f/f_0 \approx 1.3$$ brings the cost down to about 13 per cent above the air power; the saving over no spring is only about 7 per cent. A badly tuned spring is worse than none: at $$f/f_0 = 0.5$$ the muscle's power is two and a half times the air's. Now raise the wing inertia to 8 times: $$N$$ goes to about 2, the muscle without a spring needs 950 µW against 460 µW of air, and a tuned spring saves 31 per cent; at 20 times ($$N \approx 4$$) it saves more. So the spring is worth having if one is sure to tune it, and not worth much if the animal sits at $$N<1$$ and keeps changing its stroke. That fits an observation on a different animal: a hawkmoth beats about 80 per cent above its resonance and not at it, which costs elastic energy exchange but allows control by changing the beat frequency {% include bf-ref.html k="gau2022" %}. A butterfly with large wings, low $$N$$ and a high need to adjust every stroke has even less reason to sit on a resonance peak.

{: .da-bridge}
Either way the muscle has to supply the net power, and the muscle has a speed limit of its own.

<h2 id="muscle"><span class="num">06</span>The muscle: a work loop</h2>

A flight muscle is a bundle of fibres filled with sarcomeres: thin actin filaments hang from each Z-disc into the middle, thick myosin filaments sit in the middle, and when calcium arrives the myosin heads grab the actin and swivel, pulling the Z-discs together. The butterfly's muscle is **synchronous**: one nerve impulse starts one contraction, so the nervous system times every beat {% include bf-ref.html k="wiki-flight" %}. In a free-flying tiger butterfly the flight muscles showed a short burst of spikes in every stroke cycle {% include bf-ref.html k="ando2024" %}.

{% include bf.html kind="muscle" title="One sarcomere, one nerve impulse, and the problem of speed" caption="Left: a sarcomere shortening with the muscle's activation over one wingbeat (choose DVM or DLM). Right: nerve impulses and force of a synchronous muscle, one impulse per beat, against an asynchronous one. Raise the wingbeat frequency to see the twitches of the synchronous muscle fuse. The twitch time constant (12 ms) and the nerve rate (8 Hz) are illustrative." %}

To judge whether the muscle can drive the wing one has to look at a **work loop**: let the muscle's length follow the strain it sees in the thorax, activate it with a burst of impulses, and plot force against strain. The area enclosed is the net work per beat. A muscle shortening under high force delivers work, a muscle being stretched while active absorbs it, so timing is everything: activate it just as it starts to shorten and it is a motor; activate it too late and the same fibre becomes a brake. The model here is a standard one. Activation is a difference of exponentials per impulse (rise and decay times set by calcium release and removal, summed over the burst), force is activation times a Hill force-velocity relation (the force drops hyperbolically with shortening speed and rises to about 1.5 times the isometric force when lengthening) times a length factor {% include bf-ref.html k="hill" %}. Its parameters here are illustrative: $$v_{\max} = 20\ L_0/\mathrm{s}$$, 250 kPa, a decay of 12 ms.

{% include bf.html kind="workloop" id="bf-workloop" wide=1 title="The work loop of a synchronous muscle, and its frequency limit" caption="Left: force against strain over one beat, for the burst timing, frequency and number of impulses you set; blue area = net positive work, orange = net negative. Right: net specific power against wingbeat frequency, for the best burst timing at each frequency (solid) and for your timing (dashed); the red line is the power the air and the wing inertia demand in the spring-wing model of section 05. The decay time is the speed limit: shorten it and the peak moves to higher frequency." %}

The muscle model at its best timing delivers roughly 80 W per kg of muscle at 12 Hz, which sits just under the roughly 100 W/kg that insect flight muscle reaches at best {% include bf-ref.html k="muscle-power" %}, and slightly above what the wing needs. At 20 Hz with these kinetics there is no timing that gives positive work, and beyond that the fibre is permanently half-active and acts as a brake. Move the twitch decay from 12 to 6 ms and the peak moves to about 20 Hz and 90 W/kg, while 12 Hz drops to 64. That is the speed limit of a synchronous muscle: calcium has to leave the fibre before the next beat, so the frequency is capped by how fast calcium is pumped, and insects that need more than about a hundred beats a second use **asynchronous** muscle, which is stretch-activated and triggered by the thorax itself {% include bf-ref.html k="wiki-flight" %}. A butterfly gives up speed for control.

{% include bf.html kind="freq" title="Wingbeats per second, and which muscle does it" caption="Frequencies as quoted in the sources (butterflies and the hawkmoth from a wingbeat-frequency survey, the bees and midges from papers on asynchronous flight; all search-result values, see the list). Log axis." %}

{: .da-bridge}
Now the pieces can be put into a chain and the margins read off.

<h2 id="budget"><span class="num">07</span>The power budget</h2>

Following the energy from the air back to the muscle for the reference butterfly:

| Step | Quantity | Value | Where it comes from |
|---|---|---|---|
| Weight to carry | $$m g$$ | 0.785 mN | 80 mg |
| Aerodynamic power, two wings | $$2\,\Gamma\,\tfrac{4}{3\pi}(\omega\varphi)^3$$ | about 0.9 mW | section 01, $$\Gamma = 1.9\cdot 10^{-9}$$ |
| Muscle power incl. inertia, no spring | positive work only | about 1.1 mW | section 05 |
| Flight muscle mass | 20 per cent of 80 mg | 16 mg | monarch 22 to 35 per cent {% include bf-ref.html k="monarch-fmr" %} |
| Specific power demanded of the muscle | 1.1 mW / 16 mg | about 70 W/kg | |
| Specific power the muscle can give | work loop, best timing, 12 Hz | about 80 W/kg (ceiling about 100) | section 06 |

On these assumptions the butterfly's muscle works at about 70 to 90 per cent of the specific power it can deliver at this frequency. That is a strong claim from rough inputs and should be read as such: halve the wing area or double the muscle fraction and the picture changes. What the budget does show is the structure of the design problem. Weight sets the force, the wing area and the amplitude set how fast the wing must go, the Weis-Fogh number says whether the spring is worth the trouble, the lever sets the muscle's force and stroke, and the work loop says whether the muscle can follow. All five are coupled through the beat frequency, and the animal's choice of about 10 Hz sits inside the window where each works.

<p class="da-part">Part III<strong>The air, in more detail</strong></p>

<h2 id="air"><span class="num">08</span>What the air does in detail</h2>

The quasi-steady model above treats the wing as a flat plate moving in a steady stream. The measured flows of free-flying butterflies are richer: the only study I found reports wake capture, two kinds of leading-edge vortex, active and inactive upstrokes, and the Weis-Fogh clap and fling {% include bf-ref.html k="srygley2002" %}. At the Reynolds number of about 1500 air rolls up along the leading edge into a vortex that stays attached during the stroke and adds suction {% include bf-ref.html k="wiki-flight" %}, so the true $$C_L$$ is above the plate value used here, which is one reason the model comes in at 85 per cent of the weight.

The wing does more than flap up and down: elevation, sweep and pitch together make the wingtip draw a closed curve, an oval or a figure of eight, which sets the angle of attack along the stroke. The simulation in section 01 has only sweep in a tilted plane and a pitch that flips at each reversal, which is the minimum that makes lift.

**Clap and fling.** In 1973 Torkel Weis-Fogh described a mechanism for tiny wasps that has since been found in butterflies {% include bf-ref.html k="weisfogh" %}{% include bf-ref.html k="srygley2002" %}. At the top of the stroke the wings meet and **clap**; then they **fling** apart, peeling from the leading edge with the trailing edges in contact. The gap opens faster than air can reach it from outside, so air rushes in and each wing gets a vortex round its leading edge before the downstroke starts.

{% include bf.html kind="fling" title="Clap and fling, seen along the wing span" caption="Schematic cross-section of the two wings at the top of the stroke, viewed from the head. Not to scale. The ring is the vortex round the leading edge, the green arrows the air drawn into the opening gap." %}

Steering by the amplitude, sweep and twist of each wing is easy to try in the model of the whole animal below. Unequal amplitudes are the roll control described next; the orange line is the path the wingtip draws.

{% include bf.html kind="stroke" id="bf-stroke" wide=1 title="The whole beat: four wings, steering, and the path of the wingtip" caption="The 3D model of section 00 with its wings driven by an assumed stroke: elevation (up and down), a small fore-aft sweep and a twist about the span, all sinusoidal and chosen for looks, not fitted to a film. Raising 'figure-of-eight' adds a second harmonic of the sweep. Make the two wings unequal to see what the animal would have to correct. Not the force-producing stroke of section 01: no aerodynamics is solved here." %}

**Steering.** The big muscles drive; small direct muscles that attach to the hinge plates steer, changing amplitude, pitch and sweep. In the best-studied hinge, a fly's, about twenty such muscles act on a few plates {% include bf-ref.html k="hinge-fly" %}. Because the force goes as amplitude squared, a drop of the right wing's amplitude to 62 per cent cuts its force to 38 per cent, the left wing pulls harder, and the animal rolls: the sum of the two wings' forces then has a sideways moment about the body, which the 3D simulation does not include (it has symmetric wings and only height and forward motion). The hindwing is held under the forewing so that the four wings flap as two surfaces (amplexiform coupling {% include bf-ref.html k="wiki-flight" %}), which is why one wing per side is simulated above.

<h2 id="limits"><span class="num">09</span>What the model cannot tell you</h2>

- **Every parameter of the simulators is an estimate.** Mass, wing area, wing mass, wing length, muscle fraction, the 0.5 mm inner arm and the 8 mm muscle are round numbers for a cabbage-white-sized butterfly and none was measured on an animal {% include bf-ref.html k="est-params" %}. The published number it can be checked against is $$N \approx 0.4$$ for the large white {% include bf-ref.html k="lynch2024" %}; the model gives 0.66.
- **Quasi-steady aerodynamics.** The lift model has no vortex dynamics, wake capture or clap and fling, and a flat-plate coefficient. It underestimates lift (85 per cent of the weight at the default stroke).
- **Prescribed motion.** The spring-wing figure prescribes a sinusoidal stroke and computes the torque that creates it. Solving for the response to a given muscle torque would add the resonance curve with amplitude-dependent damping; the energetic conclusions are the same.
- **A generic muscle.** The Hill model and its parameters (twitch time, $$v_{\max}$$, 250 kPa) are illustrative, not fitted to a butterfly. The power ceiling of about 100 W/kg comes from a search result whose source I could not identify {% include bf-ref.html k="muscle-power" %}.
- **One lever.** A real hinge has several plates, and the thorax is not rigid. Part of the roof movement bends the box instead of turning the wing, which the lever calculation ignores. Some insects have a click mechanism with two stable positions; I did not establish whether butterflies do.
- **Flies are not butterflies.** The fulcrum notch and the twenty steering muscles are from the fly hinge {% include bf-ref.html k="hinge-fly" %}.

{: .da-bridge}
The sources behind every statement follow, with how much of each I saw.

<h2 id="sources"><span class="num">10</span>Sources</h2>

<div class="da-note" markdown="1">
**Software.** The 3D simulation is drawn with three.js (MIT licence, self-hosted in `assets/vendor/three/`), the other figures are plain SVG computed in the browser from the equations in the text (`assets/js/butterfly-phys-core.js`). Nothing is loaded from outside this site.
</div>

The list is ordered by tag. "Opened" means the page itself was read; "abstract" that the abstract was read through the Europe PMC, Crossref or a repository record; "snippet" that only a search result was seen; "estimate" marks a number or a model I computed.

{% include bf-refs.html %}

</article>

<script defer src="{{ '/assets/js/concepts.js' | relative_url }}?v={{ site.time | date: '%s' }}"></script>
<script defer src="{{ '/assets/js/figure-tools.js' | relative_url }}?v={{ site.time | date: '%s' }}"></script>
<script defer src="{{ '/assets/js/da-guide.js' | relative_url }}?v={{ site.time | date: '%s' }}"></script>
<script type="module" src="{{ '/assets/js/butterfly-figs.js' | relative_url }}?v={{ site.time | date: '%s' }}"></script>
