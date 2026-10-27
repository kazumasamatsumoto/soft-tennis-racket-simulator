import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { GRIP_OPTIONS, STRING_PATTERNS } from '../../data/racket-catalog';
import { PerformanceProfile, RacketDesign } from '../../models/racket.model';

let nextId = 0;

interface Point {
  x: number;
  y: number;
}

/** SVG 描画に必要な幾何情報（単位は mm をそのまま SVG ユーザー座標として使用）。 */
interface RacketGeometry {
  viewBox: string;
  cx: number;
  top: number;
  butt: number;
  faceCx: number;
  faceCy: number;
  faceRx: number;
  faceRy: number;
  frameStroke: number;
  gripTop: number;
  gripWidth: number;
  gripRadius: number;
  shaftPaths: string[];
  shaftStroke: number;
  bridgePath: string;
  mains: number[];
  crosses: number[];
  balanceY: number;
  centerY: number;
  dimensionX: number;
}

const GRIP_LENGTH_MM = 190;
const MARGIN_TOP = 40;
const SVG_WIDTH = 440;

@Component({
  selector: 'app-racket-preview',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './racket-preview.html',
  styleUrl: './racket-preview.scss',
})
export class RacketPreviewComponent {
  readonly design = input.required<RacketDesign>();
  readonly profile = input.required<PerformanceProfile>();

  protected readonly clipId = `face-clip-${nextId++}`;

  protected readonly geometry = computed<RacketGeometry>(() => {
    const d = this.design();
    const p = this.profile();
    const length = d.lengthMm;
    const faceRx = p.faceWidthMm / 2;
    const faceRy = p.faceHeightMm / 2;
    const cx = SVG_WIDTH / 2;
    const top = MARGIN_TOP;
    const butt = top + length;
    const faceCy = top + faceRy;
    const faceBottom = top + 2 * faceRy;
    const gripTop = butt - GRIP_LENGTH_MM;
    const throatLength = Math.max(gripTop - faceBottom, 40);
    const frameStroke = 11 + (d.frameThicknessMm - 18) * 0.5;
    const grip = GRIP_OPTIONS.find((g) => g.id === d.gripSize) ?? GRIP_OPTIONS[1];
    const gripWidth = grip.circumferenceMm / Math.PI;
    const pattern = STRING_PATTERNS.find((s) => s.id === d.stringPattern) ?? STRING_PATTERNS[1];

    // シャフトがフレームに接続する位置（楕円の下側、中心から ±φ の角度）
    const phi = (38 * Math.PI) / 180;
    const armStart = (sign: number): Point => ({
      x: cx + sign * faceRx * Math.sin(phi),
      y: faceCy + faceRy * Math.cos(phi),
    });
    const left = armStart(-1);
    const right = armStart(1);
    const shaftStroke = Math.max(frameStroke * 0.85, 9);

    let shaftPaths: string[];
    if (d.shaftType === 'double') {
      const spread = gripWidth * 0.55;
      const ctrlY = faceBottom + throatLength * 0.5;
      shaftPaths = [
        `M ${left.x} ${left.y} Q ${cx - faceRx * 0.42} ${ctrlY} ${cx - spread} ${gripTop + 4}`,
        `M ${right.x} ${right.y} Q ${cx + faceRx * 0.42} ${ctrlY} ${cx + spread} ${gripTop + 4}`,
      ];
    } else {
      const mergeY = faceBottom + throatLength * 0.42;
      shaftPaths = [
        `M ${left.x} ${left.y} Q ${cx - faceRx * 0.25} ${mergeY - 10} ${cx} ${mergeY}`,
        `M ${right.x} ${right.y} Q ${cx + faceRx * 0.25} ${mergeY - 10} ${cx} ${mergeY}`,
        `M ${cx} ${mergeY - 2} L ${cx} ${gripTop + 4}`,
      ];
    }

    // スロート部のブリッジ（ヨーク）: 楕円下部を軽く補強する弧
    const bridgeY = faceCy + faceRy * 0.78;
    const bridgeHalf = faceRx * Math.sqrt(1 - 0.78 * 0.78);
    const bridgePath = `M ${cx - bridgeHalf} ${bridgeY} Q ${cx} ${bridgeY + 26} ${cx + bridgeHalf} ${bridgeY}`;

    const innerRx = faceRx - frameStroke / 2;
    const innerRy = faceRy - frameStroke / 2;
    const mains = Array.from(
      { length: pattern.mains },
      (_, i) => cx - innerRx + ((i + 0.5) * (2 * innerRx)) / pattern.mains,
    );
    const crosses = Array.from(
      { length: pattern.crosses },
      (_, i) => faceCy - innerRy + ((i + 0.5) * (2 * innerRy)) / pattern.crosses,
    );

    return {
      viewBox: `0 0 ${SVG_WIDTH} ${butt + 40}`,
      cx,
      top,
      butt,
      faceCx: cx,
      faceCy,
      faceRx,
      faceRy,
      frameStroke,
      gripTop,
      gripWidth,
      gripRadius: gripWidth / 2,
      shaftPaths,
      shaftStroke,
      bridgePath,
      mains,
      crosses,
      balanceY: butt - d.balanceMm,
      centerY: butt - length / 2,
      dimensionX: cx + faceRx + 40,
    };
  });

  protected readonly gripWraps = computed(() => {
    const g = this.geometry();
    const count = Math.floor(GRIP_LENGTH_MM / 14);
    return Array.from({ length: count }, (_, i) => g.gripTop + 8 + i * 14);
  });

  protected readonly balanceLabel = computed(() => {
    switch (this.profile().balanceType) {
      case 'top-light':
        return 'トップライト';
      case 'top-heavy':
        return 'トップヘビー';
      default:
        return 'イーブン';
    }
  });
}
