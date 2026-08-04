import fs from "node:fs";
import path from "node:path";

const STYLE_VERSION = "202607060725";
const SCRIPT_VERSION = "202607060715";

const root = process.cwd();

const nav = `
    <header class="site-header">
      <a class="brand" href="/" aria-label="情商练习有事问AI 首页">
        <span>情商练习有事问AI</span>
        <small>聊天复盘 · 关系判断</small>
      </a>
      <nav class="site-nav" aria-label="主导航">
        <a href="/account">个人中心</a>
        <a href="/experience" target="_blank" rel="noopener">体验AI恋爱导师</a>
        <a href="/learn">学习提升</a>
      </nav>
    </header>`;

const footer = `
    <footer class="site-footer">
      <p>© 2026 鹿子野 AI Studio. 情商练习有事问AI是聊天复盘与 AI 恋爱导师项目。</p>
      <div>
        <a href="/account">个人中心</a>
        <a href="/experience" target="_blank" rel="noopener">体验AI恋爱导师</a>
        <a href="/learn">学习提升</a>
      </div>
    </footer>`;

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function replyCard(id, label, text) {
  return `
              <div class="qa-reply-card">
                <div class="qa-reply-head">
                  <span>${escapeHtml(label)}</span>
                  <button class="qa-copy-button" type="button" data-copy-target="${id}">复制</button>
                </div>
                <pre id="${id}"><code>${escapeHtml(text)}</code></pre>
              </div>`;
}

function cards(items) {
  return `
              <div class="qa-card-grid">
                ${items
                  .map(
                    (item) => `
                <div class="qa-card">
                  <h3>${escapeHtml(item.title)}</h3>
                  <p>${escapeHtml(item.text)}</p>
                </div>`
                  )
                  .join("")}
              </div>`;
}

function checkList(items) {
  return `
              <ul class="qa-check-list">
                ${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("\n                ")}
              </ul>`;
}

function orderedList(items) {
  return `
              <ol class="qa-ordered-list">
                ${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("\n                ")}
              </ol>`;
}

function prose(paragraphs) {
  return `
              <div class="qa-prose">
                ${paragraphs.map((item) => `<p>${escapeHtml(item)}</p>`).join("\n                ")}
              </div>`;
}

const pages = [
  {
    file: "eq.html",
    url: "https://r2i84a.chat/eq",
    title: "情商怎么练？用有事问AI从聊天复盘开始",
    description:
      "情商不是会说漂亮话，而是在具体关系里识别情绪、理解边界、选择合适表达的能力。有事问AI帮助用户用聊天复盘练习稳定表达。",
    breadcrumb: "情商低的人怎么练习聊天？",
    h1: "情商怎么练？",
    subtitle: "从复盘一段聊天开始。",
    intro:
      "情商不是把话说得漂亮，而是在具体关系里识别情绪、理解边界、选择合适表达。有事问AI把抽象的“高情商”拆成能练习的步骤。",
    ctaText: "上传聊天截图，获得针对这个场景的判断建议。",
    sections: [
      {
        id: "section-a",
        title: "把情商拆成四个动作",
        html: cards([
          { title: "识别对方情绪", text: "开心、敷衍、试探、抗拒、委屈、愤怒，先分清信号再回应。" },
          { title: "识别自己状态", text: "上头、焦虑、讨好、解释、防御、冷处理，都可能让表达变形。" },
          { title: "练习表达", text: "关心、邀约、道歉、拒绝、复联、结束话题，都需要不同力度。" },
        ]),
      },
      {
        id: "section-b",
        title: "为什么从聊天复盘开始",
        html: prose([
          "聊天记录是最容易被观察的沟通样本。它能看到你什么时候急着解释，什么时候把关心说成控制，什么时候为了避免冲突而过度讨好。",
          "有事问AI会把原话的可能影响、对方感受、表达风险和替代说法拆开。用户可以比较“更直接版本”和“更柔和版本”，慢慢形成自己的表达手感。",
        ]),
      },
      {
        id: "section-c",
        title: "练习模板",
        html:
          prose(["把下面的内容复制后发给 AI 导师，替换花括号中的内容。"]) +
          replyCard(
            "eq-template-copy",
            "练习模板",
            "场景：[描述你们的关系背景和当前情况]\n\n我原本想说：[填入你想发出的那句话]\n\n请帮我：\n1. 判断原话可能让对方产生什么感受\n2. 找出防御、指责、讨好或控制成分\n3. 改成清楚、有边界、不过度解释的版本\n4. 给一个直接版本和一个柔和版本"
          ),
      },
    ],
    faqs: [
      ["情商低就是不会说话吗？", "不完全是。它常常是情绪识别、边界感和关系判断同时不稳定。"],
      ["高情商回复会不会很假？", "会，如果只追求漂亮。更好的目标是清楚、自然、不过度讨好。"],
      ["AI 适合练哪些场景？", "适合练关心、道歉、拒绝、邀约、复联、结束话题和冲突修复。"],
      ["什么时候不该继续练回复？", "当对方明确拒绝或表达不想被打扰时，重点不是优化回复，而是停止推进。"],
    ],
    sidebar: [
      ["情商问题库", "/learn#questions", "问答"],
      ["文章库", "/blog", "文章"],
      ["AI 情感导师是什么", "/ai-relationship-coach", "说明"],
    ],
  },
  {
    file: "answers/girl-not-replying.html",
    url: "https://r2i84a.chat/answers/girl-not-replying",
    title: "女生不回消息怎么办？先判断关系阶段 | 情商练习有事问AI",
    description:
      "女生不回消息时，先判断关系阶段、上一句是否难接、对方投入和边界信号，再决定轻量收尾、换话题还是停止推进。",
    breadcrumb: "女生不回消息怎么办？",
    h1: "女生不回消息怎么办？",
    subtitle: "先别追问，先判断局势。",
    intro:
      "不回消息不等于一定没戏，也不等于一定要继续加码。关键是看关系阶段、上一句内容、对方投入和边界信号，再决定该等、该换话题，还是该停止推进。",
    ctaText: "上传聊天记录，让 AI 先判断她是不想回、难接话，还是只是暂时忙。",
    sections: [
      {
        id: "signals",
        title: "先看 4 个信号",
        html:
          checkList([
            "之前是否也经常隔很久才回，还是最近突然变冷。",
            "你的上一句是不是太长、太急、太重，或让对方只能表态。",
            "对方是否还会主动开启话题、反问你、解释自己在忙。",
            "是否已经出现明确拒绝、拉黑、不想被打扰等边界信号。",
          ]) +
          prose([
            "很多男生在对方不回时会立刻补一句“你怎么不回”，这通常会把压力继续推给对方。更稳的顺序是先看信号，再决定动作。",
          ]),
      },
      {
        id: "moves",
        title: "不同情况怎么处理",
        html:
          cards([
            { title: "短期没回", text: "先等，不补刀。需要开口时用轻量收尾，不追问原因。" },
            { title: "长期低投入", text: "降低投入，不解释、不讨好，把注意力放回自己的生活。" },
            { title: "明确拒绝", text: "停止推进。边界已经出现时，优化回复不是重点。" },
          ]) +
          orderedList([
            "先停 12–24 小时，避免连续追问。",
            "看上一次聊天是不是难接，必要时换一个轻话题。",
            "如果对方持续低投入，减少主动频率，而不是加码证明自己。",
          ]),
      },
      {
        id: "reply",
        title: "可参考回复",
        html:
          prose(["适合轻量收尾，不施压，也不把对方逼到必须解释的位置。"]) +
          replyCard(
            "girl-not-replying-copy",
            "参考回复",
            "刚看到你可能在忙，没事。\n我先去处理点事，回头再聊。"
          ),
      },
    ],
    faqs: [
      ["女生不回消息是不是没戏了？", "不一定。要看她是突然变冷、长期低投入，还是本来就回复慢。单次不回不能直接下结论。"],
      ["要不要再发一条？", "如果上一句没有明显冒犯，可以等一段时间后轻量收尾；不要连续追问。"],
      ["她一直不回怎么办？", "长期不回就是强信号。继续解释和讨好通常只会让自己更低位。"],
      ["什么时候应该停止推进？", "对方明确拒绝、拉黑、表达不想被打扰，或持续回避时，应该停止推进。"],
    ],
    sidebar: [
      ["暧昧期怎么推进关系", "/answers/ambiguous-relationship", "问答"],
      ["男生聊天冷场怎么办", "/answers/chat-cold", "问答"],
      ["AI 情感导师靠谱吗", "/answers/is-ai-relationship-coach-reliable", "说明"],
    ],
  },
  {
    file: "answers/is-ai-relationship-coach-reliable.html",
    url: "https://r2i84a.chat/answers/is-ai-relationship-coach-reliable",
    title: "AI 情感导师靠谱吗？看它有没有判断依据 | 情商练习有事问AI",
    description:
      "AI 情感导师靠谱不靠谱，关键看它是否解释判断依据、给条件化建议、承认不确定性，并提醒边界，而不是承诺保证拿下。",
    breadcrumb: "AI 情感导师靠谱吗？",
    h1: "AI 情感导师靠谱吗？",
    subtitle: "靠谱的不是万能话术，而是判断依据。",
    intro:
      "健康的 AI 情感导师应该帮你看清关系阶段、对方信号和自己的表达风险，而不是承诺保证拿下、保证复合。判断依据越清楚，建议才越可复盘。",
    ctaText: "把聊天记录、关系背景和你的目标一起给 AI，先看判断依据再看回复。",
    sections: [
      {
        id: "standard",
        title: "靠谱建议的 3 个特点",
        html: checkList([
          "先说明判断依据，比如回复变短、没有反问、连续回避邀约。",
          "给条件化建议，而不是说“她一定喜欢你”或“这样一定成功”。",
          "回复短、自然、有余地，不把用户推向讨好、控制或骚扰。",
        ]),
      },
      {
        id: "risks",
        title: "不靠谱的信号",
        html:
          prose([
            "如果一个工具只输出“高情商模板”，却不问关系背景、不解释判断依据，还承诺成功率，风险就很高。感情关系有大量上下文，不能靠一句万能回复解决。",
          ]) +
          cards([
            { title: "承诺结果", text: "保证复合、保证拿下、保证她喜欢你，都是高风险表达。" },
            { title: "不看上下文", text: "不问关系阶段和对方反馈，就直接给话术，容易误导行动。" },
            { title: "鼓励越界", text: "把持续打扰包装成深情，会损害双方边界。" },
          ]),
      },
      {
        id: "prompt",
        title: "正确使用方式",
        html:
          prose(["提问时补充背景，结果会更可用。"]) +
          replyCard(
            "ai-reliable-copy",
            "提问模板",
            "我们认识多久：\n最近一次互动：\n聊天记录：\n我想达到的目标：\n请先判断关系阶段，再给建议。"
          ),
      },
      {
        id: "limits",
        title: "不能替代什么",
        html: prose([
          "AI 情感导师不能替代心理咨询、法律建议、危机干预或现实安全支持。涉及伤害、威胁、跟踪、严重心理危机时，应优先找现实中的专业帮助。",
        ]),
      },
    ],
    faqs: [
      ["AI 情感导师真的懂感情吗？", "它不具备真实情感，但可以用结构化框架帮你复盘聊天和表达风险。"],
      ["它能判断她喜不喜欢我吗？", "可以辅助判断趋势，不能百分百确认对方真实心意。"],
      ["它会不会把人教得套路？", "如果只追求控制和拿下，会套路化；更好的使用方式是练判断、边界和表达。"],
    ],
    sidebar: [
      ["AI 情感建议不能替代什么", "/ai-relationship-coach", "边界"],
      ["怎么判断她是不是喜欢我", "/answers/does-she-like-me", "问答"],
      ["女生不回消息怎么办", "/answers/girl-not-replying", "问答"],
    ],
  },
  {
    file: "answers/ambiguous-relationship.html",
    url: "https://r2i84a.chat/answers/ambiguous-relationship",
    title: "暧昧期怎么推进关系？别只背邀约话术 | 情商练习有事问AI",
    description:
      "暧昧期推进关系前，先看对方主动性、话题延展、线下互动和投入程度，再给有台阶、不施压的邀约。",
    breadcrumb: "暧昧期怎么推进关系？",
    h1: "暧昧期怎么推进关系？",
    subtitle: "推进不是逼表态，而是给轻松选择。",
    intro:
      "暧昧期最怕两种误判：对方只是礼貌，你却强行推进；对方有兴趣，你却一直停在安全话题里不敢邀约。先判断互动基础，再决定推进力度。",
    ctaText: "把你们的聊天和最近互动给 AI，先判断现在适不适合推进。",
    sections: [
      {
        id: "ready",
        title: "先判断能不能推进",
        html: checkList([
          "对方是否主动找你，或愿意延展你开启的话题。",
          "聊天是否有轻松感，而不是你单方面找话题。",
          "对方是否接受过低压力邀约，比如一起吃饭、散步、看展。",
          "你推进的目的是否清楚，是见面增进了解，而不是逼对方确认关系。",
        ]),
      },
      {
        id: "invite",
        title: "邀约要有台阶",
        html:
          prose([
            "好的邀约不是“你到底愿不愿意”，而是给对方一个轻松、可退可进的选择。先给具体场景，再留出拒绝空间。",
          ]) +
          replyCard(
            "ambiguous-copy",
            "参考邀约",
            "这周末我想去试一家新店，\n你有空的话一起去，没空也没事。"
          ),
      },
      {
        id: "slow-down",
        title: "什么时候要放慢",
        html:
          prose([
            "如果对方很少主动、回复越来越短、连续回避见面，继续推进容易变成施压。此时更适合降低频率，观察对方是否会重新投入。",
          ]) +
          orderedList([
            "先减少确认关系的提问。",
            "把话题从情绪拉回轻松互动。",
            "观察对方是否主动补充信息、反问或提出下次机会。",
          ]),
      },
    ],
    faqs: [
      ["暧昧期一定要表白吗？", "不一定。很多时候先创造线下互动，比直接逼表态更稳。"],
      ["对方说再看时间是不是拒绝？", "可能是忙，也可能是低投入。要看之后是否主动补时间或继续延展话题。"],
      ["邀约被拒绝要不要继续约？", "先看拒绝方式。如果对方没有给替代时间，短期内不要连续邀约。"],
    ],
    sidebar: [
      ["女生不回消息怎么办", "/answers/girl-not-replying", "问答"],
      ["怎么判断她是不是喜欢我", "/answers/does-she-like-me", "问答"],
      ["AI 情感导师靠谱吗", "/answers/is-ai-relationship-coach-reliable", "说明"],
    ],
  },
  {
    file: "tong-jincheng-skill.html",
    url: "https://r2i84a.chat/tong-jincheng-skill",
    title: "童锦程 Skill 是什么？非官方恋爱表达练习指南",
    description:
      "本文说明如何把公开语境下的恋爱表达拆成可练习能力：先判断关系位置，再选择表达动作。本站不是童锦程官方产品，也不代表其本人或团队。",
    breadcrumb: "童锦程 Skill 是什么？",
    h1: "童锦程 Skill 是什么？",
    subtitle: "真正值得练的是判断，不是模仿口癖。",
    intro:
      "这里说明如何把公开语境下的恋爱表达拆成可练习能力：先判断关系位置，再选择表达动作。本站不是童锦程本人，也不代表官方授权。",
    ctaText: "用 AI 复盘你的聊天，学习判断框架，而不是模仿任何真实人物。",
    sections: [
      {
        id: "intent",
        title: "用户真正想找什么",
        html: prose([
          "搜索“童锦程 Skill”的用户，通常不是只想复制某个人的口癖，而是想获得更自然的恋爱表达、更准的关系判断和更稳的推进节奏。",
          "因此，这个专题不做冒充式生成，也不使用肖像、截图或官方暗示。它只保留可以被泛化的沟通原则：先判断关系位置，再选择表达动作。",
        ]),
      },
      {
        id: "learn",
        title: "建议学什么",
        html: cards([
          { title: "给对方台阶", text: "表达喜欢或邀约时，不把对方逼到只能接受或拒绝的位置。" },
          { title: "不考验人性", text: "不用消失、刺激、设局测试来确认对方是否在乎。" },
          { title: "先把自己过好", text: "稳定生活、事业和状态，比一句漂亮话更能影响关系底气。" },
        ]),
      },
      {
        id: "prompt",
        title: "非官方练习提示词",
        html: replyCard(
          "tong-skill-copy",
          "练习提示词",
          "请不要扮演任何真实人物。\n请参考“直白、短句、先判断后建议、不给鸡汤、不讨好、不控制”的表达方式，帮我复盘这段恋爱聊天。\n\n重点不是模仿口癖，而是：\n- 判断关系位置\n- 找出我是否太急或太解释\n- 给对方保留台阶\n- 给出自然、短、稳的回复"
        ),
      },
      {
        id: "boundary",
        title: "必要边界",
        html: checkList([
          "本站不是童锦程官方产品，也不代表其本人、团队或任何官方授权。",
          "不建议冒充真实人物。更合适的是学习可泛化的表达原则。",
          "当对方明确拒绝或表达不想被打扰时，应停止推进。",
        ]),
      },
    ],
    faqs: [
      ["童锦程 Skill 是官方的吗？", "不是。本站不代表其本人、团队或任何官方授权。"],
      ["能不能模仿真实人物说话？", "不建议。更合适的是学习可泛化的表达原则，不扮演具体真实人物。"],
      ["学恋爱表达会不会变油腻？", "如果只学话术会。真正该练的是判断、边界、尊重和稳定表达。"],
    ],
    sidebar: [
      ["AI 情感导师是什么", "/ai-relationship-coach", "说明"],
      ["文章库", "/blog", "文章"],
      ["情商问题库", "/learn#questions", "问答"],
    ],
  },
  {
    file: "ai-relationship-coach.html",
    url: "https://r2i84a.chat/ai-relationship-coach",
    title: "AI 情感建议不能替代什么？有事问AI安全边界",
    description:
      "AI 情感建议适合关系复盘、聊天局势判断、回复建议和表达练习，但不能替代心理咨询、法律建议、危机干预或现实安全支持。",
    breadcrumb: "AI 情感建议不能替代什么？",
    h1: "AI 情感建议不能替代什么？",
    subtitle: "先复盘局势，但不要把决定外包给 AI。",
    intro:
      "AI 情感导师适合做聊天复盘、关系判断和表达练习，但它不能确认一个人的真实心意，也不能替你承担重大关系后果。边界越清楚，建议越安全。",
    ctaText: "普通聊天困惑可以交给 AI 先复盘；高风险情况应优先找现实支持。",
    sections: [
      {
        id: "can-do",
        title: "它适合做什么",
        html: checkList([
          "复盘聊天记录，找出冷场、解释过度、讨好或防御位置。",
          "根据关系阶段、对方投入和边界信号，给下一步建议。",
          "把关心、道歉、邀约、拒绝等表达改得更清楚、更自然。",
        ]),
      },
      {
        id: "cannot-do",
        title: "不能替代什么",
        html: cards([
          { title: "心理咨询", text: "严重焦虑、创伤、成瘾、自伤风险，需要专业帮助。" },
          { title: "法律建议", text: "纠纷、威胁、财产、隐私和人身安全问题，应咨询专业人士。" },
          { title: "现实沟通", text: "AI 可以帮你准备表达，但不能替你承担真实关系互动。" },
        ]),
      },
      {
        id: "danger",
        title: "这些情况先停下来",
        html: checkList([
          "对方明确说不要联系、不要再发、不要见面。",
          "出现威胁、跟踪、暴力、报复、泄露隐私等风险。",
          "你已经连续多次追问、解释、道歉，对方仍然不回应。",
        ]),
      },
      {
        id: "structure",
        title: "更安全的提问结构",
        html: replyCard(
          "ai-boundary-copy",
          "提问模板",
          "关系背景：\n最近一次聊天：\n我想达成的目标：\n对方有没有明确拒绝或不舒服：\n\n请先判断风险边界，再告诉我是否应该继续沟通。"
        ),
      },
    ],
    faqs: [
      ["AI 情感建议能保证复合吗？", "不能。任何保证复合、保证拿下的说法都不可靠。"],
      ["什么时候不该问 AI 继续怎么回？", "对方明确拒绝、表达不想被打扰，或出现安全风险时，不该继续优化回复。"],
      ["AI 能替代心理咨询吗？", "不能。它只能做普通沟通复盘和表达练习。"],
    ],
    sidebar: [
      ["AI 情感导师靠谱吗", "/answers/is-ai-relationship-coach-reliable", "说明"],
      ["女生不回消息怎么办", "/answers/girl-not-replying", "问答"],
      ["学习提升", "/learn", "资料"],
    ],
  },
];

function faqJson(faqs) {
  return faqs.map(([question, answer]) => ({
    "@type": "Question",
    name: question,
    acceptedAnswer: { "@type": "Answer", text: answer },
  }));
}

function renderPage(page) {
  const isNested = page.file.includes("/");
  const prefix = isNested ? "../" : "./";
  const sections = page.sections;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${page.url}#webpage`,
        url: page.url,
        name: page.title,
        inLanguage: "zh-CN",
        description: page.description,
      },
      {
        "@type": "FAQPage",
        mainEntity: faqJson(page.faqs),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "情商练习有事问AI", item: "https://r2i84a.chat/" },
          { "@type": "ListItem", position: 2, name: "学习提升", item: "https://r2i84a.chat/learn" },
          { "@type": "ListItem", position: 3, name: page.breadcrumb, item: page.url },
        ],
      },
    ],
  };

  const faqSection =
    page.faqs.length > 0
      ? `
            <section class="qa-section" id="faq">
              <div class="qa-section-heading"><h2>常见问题</h2></div>
              <div class="qa-faq-list">
                ${page.faqs
                  .map(
                    ([question, answer], index) => `
                <div class="qa-faq-item">
                  <button class="qa-faq-toggle" type="button" aria-expanded="${index === 0 ? "true" : "false"}">
                    <span>${escapeHtml(question)}</span>
                    <span class="qa-faq-icon">⌄</span>
                  </button>
                  <div class="qa-faq-answer">${escapeHtml(answer)}</div>
                </div>`
                  )
                  .join("")}
              </div>
            </section>`
      : "";

  const toc = [
    ...sections.map((section) => [section.title, `#${section.id}`]),
    ...(page.faqs.length ? [["常见问题", "#faq"]] : []),
  ];

  return `<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(page.title)}</title>
    <meta name="description" content="${escapeHtml(page.description)}" />
    <meta name="robots" content="index, follow" />
    <link rel="canonical" href="${page.url}" />
    <meta property="og:type" content="article" />
    <meta property="og:title" content="${escapeHtml(page.breadcrumb)}" />
    <meta property="og:description" content="${escapeHtml(page.description)}" />
    <meta property="og:url" content="${page.url}" />
    <meta property="og:image" content="https://r2i84a.chat/assets/relationship-ai-workbench.png" />
    <link rel="stylesheet" href="${prefix}styles.css?v=${STYLE_VERSION}" />
    <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
  </head>
  <body>
    <div class="qa-page-shell">
${nav}
      <main>
        <section class="qa-hero">
          <div class="qa-hero-inner">
            <nav class="qa-breadcrumb" aria-label="面包屑">
              <a href="/learn">学习提升</a>
              <span>/</span>
              <span>${escapeHtml(page.breadcrumb)}</span>
            </nav>
            <h1>${escapeHtml(page.h1)}</h1>
            <p class="qa-subtitle">${escapeHtml(page.subtitle)}</p>
            <p class="qa-intro">${escapeHtml(page.intro)}</p>
          </div>
        </section>

        <section class="qa-layout">
          <article class="qa-main">
            ${sections
              .map(
                (section) => `
            <section class="qa-section" id="${section.id}">
              <div class="qa-section-heading"><h2>${escapeHtml(section.title)}</h2></div>
              ${section.html}
            </section>`
              )
              .join("")}
${faqSection}
          </article>

          <aside class="qa-sidebar" aria-label="页面侧栏">
            <div class="qa-cta-card">
              <h2>把这个问题直接问 AI</h2>
              <p>${escapeHtml(page.ctaText)}</p>
              <a href="/experience" target="_blank" rel="noopener">立即体验 →</a>
            </div>

            <div class="qa-sidebar-card">
              <h2>本页内容</h2>
              <nav class="qa-toc" aria-label="本页内容">
                ${toc
                  .map(([label, href], index) => `<a class="${index === 0 ? "active" : ""}" href="${href}">${escapeHtml(label)}</a>`)
                  .join("\n                ")}
              </nav>
            </div>

            <div class="qa-sidebar-card">
              <h2>推荐阅读</h2>
              <div class="qa-side-links">
                ${page.sidebar
                  .map(
                    ([label, href, tag]) => `<a class="qa-side-link" href="${href}"><strong>${escapeHtml(label)}</strong><span>${escapeHtml(tag)}</span></a>`
                  )
                  .join("\n                ")}
              </div>
            </div>
          </aside>
        </section>

        <section class="qa-bottom-cta">
          <div class="qa-bottom-cta-inner">
            <div>
              <strong>还有别的问题？</strong>
              <a href="/learn">查看全部问答库 →</a>
            </div>
            <a class="qa-bottom-primary" href="/experience" target="_blank" rel="noopener">直接体验 AI 导师</a>
          </div>
        </section>
      </main>
${footer}
    </div>
    <script src="${prefix}script.js?v=${SCRIPT_VERSION}"></script>
  </body>
</html>
`;
}

for (const page of pages) {
  const filePath = path.join(root, page.file);
  fs.writeFileSync(filePath, renderPage(page));
  console.log(`generated ${page.file}`);
}
