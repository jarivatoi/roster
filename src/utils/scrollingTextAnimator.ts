import { gsap } from 'gsap';

export interface ScrollingTextOptions {
  container: HTMLElement;
  textElement: HTMLElement;
  text: string;
  pauseDuration?: number;
  scrollDuration?: number;
  easing?: string;
}

export class ScrollingTextAnimator {
  private timeline: gsap.core.Timeline | null = null;
  private options: Required<ScrollingTextOptions>;
  private isPaused: boolean = false;
  private scrollTimeout: NodeJS.Timeout | null = null;

  constructor(options: ScrollingTextOptions) {
    this.options = {
      pauseDuration: 1,
      scrollDuration: 2.5,
      easing: 'power2.inOut',
      ...options
    };
  }

  pause(): void {
    if (this.timeline && !this.isPaused) {
      this.timeline.pause();
      this.isPaused = true;
    }
  }

  resume(): void {
    if (this.timeline && this.isPaused) {
      this.timeline.resume();
      this.isPaused = false;
    }
  }

  handleScrollStart(): void {
    this.pause();
    
    // Clear any existing timeout
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
    }
    
    // Set timeout to resume after scroll stops
    this.scrollTimeout = setTimeout(() => {
      this.resume();
      this.scrollTimeout = null;
    }, 150); // Resume 150ms after scroll stops
  }

  start(): void {
    this.stop(); // Clear any existing animation
    
    const { container, textElement, pauseDuration, scrollDuration, easing } = this.options;
    
    // Reset position
    gsap.set(textElement, { x: 0 });
    
    // Force layout recalculation
    container.offsetWidth;
    textElement.offsetWidth;
    
    const containerWidth = container.offsetWidth;
    
    // Measure actual text width using a temporary span for accuracy.
    // scrollWidth on the text element can under-report when the element's
    // width is constrained by the parent's `width: 100%`.
    let textWidth = textElement.scrollWidth;
    try {
      const tempSpan = document.createElement('span');
      tempSpan.style.whiteSpace = 'nowrap';
      tempSpan.style.display = 'inline-block';
      tempSpan.style.position = 'absolute';
      tempSpan.style.visibility = 'hidden';
      tempSpan.style.fontSize = window.getComputedStyle(textElement).fontSize;
      tempSpan.style.fontWeight = window.getComputedStyle(textElement).fontWeight;
      tempSpan.style.fontFamily = window.getComputedStyle(textElement).fontFamily;
      tempSpan.style.letterSpacing = window.getComputedStyle(textElement).letterSpacing;
      tempSpan.textContent = textElement.textContent || '';
      document.body.appendChild(tempSpan);
      textWidth = tempSpan.scrollWidth;
      document.body.removeChild(tempSpan);
    } catch {
      // Fallback to element scrollWidth
    }
    
    if (textWidth <= containerWidth) {
      return;
    }
    
    // Calculate scroll distance with padding buffer to ensure full text is visible
    // The buffer prevents the end of the text from being clipped due to
    // subpixel rounding or overflow measurement imprecision
    const overflowWidth = textWidth - containerWidth;
    const paddingBuffer = Math.max(8, overflowWidth * 0.05);
    const scrollDistance = overflowWidth + paddingBuffer;
    
    // Create TweenMax timeline for longer text with spaces
    this.timeline = gsap.timeline({ 
      repeat: -1,
      ease: easing
    });
    
    // Enhanced animation sequence for better readability
    this.timeline
      // Initial pause at start (longer for reading)
      .to(textElement, {
        duration: pauseDuration,
        x: 0,
        ease: 'none'
      })
      // Smooth scroll to end (slower for longer text)
      .to(textElement, {
        duration: scrollDuration,
        x: -scrollDistance,
        ease: easing
      })
      // Pause at end (longer for reading end of text)
      .to(textElement, {
        duration: pauseDuration,
        x: -scrollDistance,
        ease: 'none'
      })
      // Smooth scroll back to start
      .to(textElement, {
        duration: scrollDuration,
        x: 0,
        ease: easing
      });
  }

  stop(): void {
    if (this.timeline) {
      this.timeline.kill();
      this.timeline = null;
    }
  }

  updateText(newText: string): void {
    this.options.text = newText;
    this.start(); // Restart animation with new text
  }

  // Static method for quick setup
  static create(options: ScrollingTextOptions): ScrollingTextAnimator {
    const animator = new ScrollingTextAnimator(options);
    animator.start();
    return animator;
  }
}