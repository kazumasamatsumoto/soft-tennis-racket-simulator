import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { FRAME_MATERIALS, STRING_PATTERNS } from '../../data/racket-catalog';
import { PerformanceProfile, RacketDesign } from '../../models/racket.model';

interface BuildStep {
  title: string;
  detail: string;
}

const ALUMINUM_STEPS: BuildStep[] = [
  {
    title: '設計図を実寸で描く',
    detail:
      'フェイスの楕円、スロート、グリップ位置を 1:1 で紙に起こし、ストリング穴の位置を決めます。',
  },
  {
    title: 'アルミパイプを曲げる',
    detail: 'パイプベンダーで楕円に沿って少しずつ曲げ、設計図に重ねて形を確認します。',
  },
  {
    title: 'シャフトとヨークを接合',
    detail: 'リベットまたはロウ付けでシャフトを固定し、スロート部にブリッジを入れて面を閉じます。',
  },
  {
    title: 'グロメット穴を開ける',
    detail: 'ストリングパターンに合わせて等間隔に穴を開け、バリを取ってグロメットを通します。',
  },
  {
    title: 'グリップを成形',
    detail: 'グリップ芯材を八角形に削り、下巻きとグリップテープを巻きます。',
  },
  {
    title: 'ストリングを張る',
    detail: '縦糸から順に張り、指定テンションに合わせて横糸を通します。',
  },
];

const CARBON_STEPS: BuildStep[] = [
  {
    title: '設計図と型（モールド）を用意',
    detail: 'フェイスとシャフトの形状を CAD で起こし、アルミまたは樹脂で雌型を製作します。',
  },
  {
    title: 'プリプレグを裁断・積層',
    detail: '狙いの剛性と厚みになるよう繊維方向（0°/±45°/90°）を組み合わせてシート状に積層します。',
  },
  {
    title: 'チューブ状に巻いて型に配置',
    detail:
      'ナイロンブラダー（風船）に巻き付け、型の溝に沿って配置します。シャフトの分岐部は特に丁寧に。',
  },
  {
    title: '加熱・加圧して硬化',
    detail: '型を閉じ、ブラダーに内圧をかけながら 130〜150℃ で硬化させます。',
  },
  {
    title: '脱型と仕上げ',
    detail: 'バリを落とし、グロメット穴を開けてサンディングし、塗装でカラーリングします。',
  },
  {
    title: 'グリップとストリング',
    detail: 'エンドキャップとグリップを取り付け、ストリングを指定テンションで張ります。',
  },
];

@Component({
  selector: 'app-build-guide',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './build-guide.html',
  styleUrl: './build-guide.scss',
})
export class BuildGuideComponent {
  readonly design = input.required<RacketDesign>();
  readonly profile = input.required<PerformanceProfile>();

  protected readonly material = computed(
    () => FRAME_MATERIALS.find((m) => m.id === this.design().materialId) ?? FRAME_MATERIALS[1],
  );

  protected readonly steps = computed<BuildStep[]>(() =>
    this.design().materialId === 'aluminum' ? ALUMINUM_STEPS : CARBON_STEPS,
  );

  protected readonly difficultyStars = computed(() => {
    const d = this.profile().buildDifficulty;
    return Array.from({ length: 5 }, (_, i) => i < d);
  });

  protected readonly difficultyLabel = computed(() => {
    const labels = ['', 'とても易しい', '易しい', '普通', '難しい', 'とても難しい'];
    return labels[this.profile().buildDifficulty] ?? '普通';
  });

  protected readonly tips = computed<string[]>(() => {
    const d = this.design();
    const m = this.material();
    const pattern = STRING_PATTERNS.find((p) => p.id === d.stringPattern) ?? STRING_PATTERNS[1];
    const tips: string[] = [];
    if (d.shaftType === 'double') {
      tips.push(
        'ダブルシャフトは左右の長さと角度を揃える治具が必要です。片側がずれると面がねじれます。',
      );
    } else {
      tips.push(
        'シングルシャフトは分岐部に応力が集中します。積層や接合をこの部分だけ 1〜2 層増やすと安心です。',
      );
    }
    if (d.frameThicknessMm < 21) {
      tips.push(
        'フレーム厚が薄いため強度に余裕がありません。試作段階では 1〜2mm 厚くして様子を見るのがおすすめです。',
      );
    } else if (d.frameThicknessMm > 26) {
      tips.push(
        'フレームが厚いぶん重量が増えやすいので、積層数か肉厚で目標重量に合わせてください。',
      );
    }
    if (d.weightG < 215) {
      tips.push(
        '目標重量が軽いため、材料を削る必要があります。先に重めに作って削るより、積層数を減らして狙うほうが安全です。',
      );
    }
    if (d.balanceMm > d.lengthMm / 2 - 5) {
      tips.push(
        'トップヘビーに仕上げるには、フェイス上部にウェイトテープを貼るか、グリップ側を軽くします。',
      );
    } else if (d.balanceMm < d.lengthMm / 2 - 35) {
      tips.push(
        'トップライトに仕上げるには、グリップ内部にウェイトを入れる方法が調整しやすいです。',
      );
    }
    if (d.tensionLbs < 24) {
      tips.push(
        '低テンションはストリングの収まりが悪くなりがちです。縫い目の交差部でズレないよう丁寧に通してください。',
      );
    }
    if (d.tensionLbs > 32) {
      tips.push('高テンションではグロメット穴にかかる力が大きくなります。穴の縁の仕上げを丁寧に。');
    }
    tips.push(
      `ストリングは ${pattern.mains} 本 × ${pattern.crosses} 本です。穴数は合計 ${2 * (pattern.mains + pattern.crosses)} 個を目安に配置します。`,
    );
    if (m.id !== 'aluminum') {
      tips.push('カーボンの切削・研磨では必ず防塵マスクと保護メガネを着用してください。');
    }
    return tips;
  });
}
