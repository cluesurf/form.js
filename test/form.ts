import { Hash, List, Form } from '../code/type'
import DATA from './data.json'

export const ffmpeg_audio_codec: List = {
  form: 'list',
  save: '~/test/hold/ffmpeg',
  list: ['foo', 'bar'],
}

export const ffmpeg_subtitle_codec: List = {
  form: 'list',
  save: '~/test/hold/ffmpeg',
  list: ['foo', 'bar'],
}

export const ffmpeg_video_codec: List = {
  form: 'list',
  save: '~/test/hold/ffmpeg',
  list: ['foo', 'bar'],
}

export const something_with_enum: Form = {
  form: 'form',
  save: '~/test/hold',
  link: {
    list: { list: true, take: ['foo', 'bar'] },
    item: { take: ['hello-world'] },
  },
}

export const data_form: Form = {
  form: 'form',
  save: '~/test/hold',
  link: {
    intraFrameOnly: { like: 'boolean' },
    label: { like: 'string' },
    lossless: { like: 'boolean' },
    lossy: { like: 'boolean' },
    supportsDecoding: { like: 'boolean' },
    supportsEncoding: { like: 'boolean' },
    type: { like: 'string' },
  },
}

export const data_hash: Hash = {
  save: '~/test/hold/data',
  bond: { like: 'data_form' },
  form: 'hash',
  hash: DATA as Record<string, any>,
}

export const ffmpeg_strict_option: List = {
  form: 'list',
  save: '~/test/hold',
  list: ['very', 'strict', 'normal', 'unofficial', 'experimental'],
}

export const remove_audio_from_video_with_ffmpeg_using_file_paths: Form =
  {
    form: 'form',
    save: '~/test/hold',
    link: {
      inputPath: { like: 'string' },
      outputPath: { like: 'string' },
      native: { like: 'html_div_element' },
    },
  }

export const remove_audio_from_video_with_ffmpeg: Form = {
  form: 'form',
  save: '~/test/hold',
  link: {
    input: { like: 'string', note: `The input video bytes.` },
  },
}

export const test_union: Form = {
  form: 'form',
  save: '~/test/hold',
  case: [
    { like: 'remove_audio_from_video_with_ffmpeg' },
    { like: 'remove_audio_from_video_with_ffmpeg_using_file_paths' },
  ],
}

export const add_audio_to_video_with_ffmpeg_using_file_paths: Form = {
  form: 'form',
  save: '~/test/hold',
  link: {
    audioCodec: { base: 'aac', like: 'string' },
    fit: { like: 'boolean' },
    inputAudioPath: { like: 'string' },
    inputVideoPath: { like: 'string' },
    outputPath: { like: 'string' },
  },
}

export const add_audio_to_video_with_ffmpeg: Form = {
  form: 'form',
  save: '~/test/hold',
  link: {
    audioCodec: { base: 'aac', like: 'string' },
    fit: { like: 'boolean' },
    inputAudio: { like: 'string' },
    inputVideo: { like: 'string' },
  },
}

export const convert_video_to_audio_with_ffmpeg: Form = {
  form: 'form',
  save: '~/test/hold',
  link: {
    inputPath: { like: 'string' },
    outputPath: { like: 'string' },
  },
}

const convert_video_with_ffmpeg_base: Form = {
  form: 'form',
  save: '~/test/hold',
  link: {
    audioBitRate: { like: 'integer' },
    audioChannels: { like: 'integer' },
    audioCodec: { like: 'ffmpeg_audio_codec' },
    audioSamplingFrequency: { like: 'decimal' },
    duration: { like: 'integer' },
    endTime: {
      case: [
        {
          like: 'decimal',
          test: 'test_time_string',
        },
        {
          like: 'string',
          test: 'test_time_string',
        },
      ],
    },
    frameRate: { like: 'integer' },
    rotation: { like: 'decimal' },
    scaleHeight: { like: 'integer' },
    scaleWidth: { like: 'integer' },
    startTime: { like: 'integer' },
    strict: { like: 'boolean' },
    subtitleCodec: { like: 'ffmpeg_subtitle_codec' },
    videoBitRate: { like: 'integer' },
    videoCodec: { like: 'ffmpeg_video_codec' },
  },
}

export const convert_video_with_ffmpeg_using_file_node_paths: Form = {
  form: 'form',
  save: '~/test/hold',
  leak: true,
  link: {
    inputPath: { like: 'string' },
    outputPath: { like: 'string' },
    ...convert_video_with_ffmpeg_base.link,
  },
}

export const convert_video_with_ffmpeg: Form = {
  form: 'form',
  save: '~/test/hold',
  link: {
    input: { like: 'array_buffer' },
    output: { like: 'array_buffer' },
    ...convert_video_with_ffmpeg_base.link,
  },
}

export const top: Form = {
  form: 'form',
  save: '~/test/hold',
  link: {
    id: { like: 'string' },
    subtitle_codec: { like: 'ffmpeg_subtitle_codec' },
    children: { like: 'top', list: true },
    parent: { like: 'top', need: false },
    nested: { like: 'top_nested', need: false },
    again: { like: 'top_nested', list: true },
    leaf: { like: 'string', need: false },
  },
}

export const top_nested: Form = {
  form: 'form',
  save: '~/test/hold',
  link: {
    id: { like: 'string' },
    bond: { like: 'integer' },
  },
}

/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-explicit-any */

export const script: Form = {
  form: 'form',
  save: '~/test/hold',
  link: {
    title: { like: 'string' },
    id: { like: 'string', size: 32 },
    slug: { like: 'string' },
    code: { like: 'string', need: false },
    is_rtl: { like: 'boolean', need: false, fall: false },
    is_vertical: { like: 'boolean', need: false, fall: false },
    category: {
      like: 'string',
      take: ['alphabet', 'abugida', 'syllabary', 'logographic'],
    },
  },
}

export const language: Form = {
  form: 'form',
  save: '~/test/hold',
  link: {
    id: { like: 'string', size: 32 },
    // code: { like: 'string' },
    slug: { like: 'string' },
    iso639_1: { like: 'string' },
    iso639_2: { like: 'string' },
    iso639_3: { like: 'string' },
    category: { like: 'string' },
    title: { like: 'string' },
    flow_count: { like: 'integer', fall: 0 },
    // flow_code_seed: { like: 'integer', fall: 0 },
    flows: { list: true, like: 'language_flow', back: 'language' },
    is_natural: { like: 'boolean', need: false },
    is_constructed: { like: 'boolean', need: false },
  },
}

export const language_flow_example: Form = {
  form: 'form',
  save: '~/test/hold',
  link: {
    id: { like: 'string', size: 32 },
    sense: { like: 'language_flow_sense' },
    sentence: { like: 'language_highlighted_sentence' },
  },
}

export const language_highlighted_sentence: Form = {
  form: 'form',
  save: '~/test/hold',
  link: {
    id: { like: 'string', size: 32 },
    text: { like: 'string' },
    highlighted_indices: { like: 'json' },
  },
}

export const language_flow_list: Form = {
  form: 'form',
  save: '~/test/hold',
  link: {
    id: { like: 'string', size: 32 },
    slug: { like: 'string' },
    title: { like: 'string' },
    items: {
      like: 'language_flow',
      list: true,
      back: 'list',
    },
  },
}

export const language_flow_translation_list: Form = {
  form: 'form',
  save: '~/test/hold',
  link: {
    id: { like: 'string', size: 32 },
    slug: { like: 'string' },
    title: { like: 'string' },
    source: {
      link: {
        language: { like: 'language' },
        script: { like: 'language' },
      },
    },
    target: {
      link: {
        language: { like: 'language' },
        script: { like: 'language' },
      },
    },
    items: {
      like: 'language_flow_translation_list_item',
      list: true,
      back: 'list',
    },
  },
}

export const language_flow_translation_list_item: Form = {
  form: 'form',
  save: '~/test/hold',
  link: {
    id: { like: 'string', size: 32 },
    list: { like: 'language_flow_translation_list' },
    translation: { like: 'language_flow_translation' },
    position: {
      need: false,
      link: {
        row: { like: 'integer', need: false, fall: 0 },
        column: { like: 'integer', need: false, fall: 0 },
      },
    },
  },
}

export const language_flow_translation: Form = {
  form: 'form',
  save: '~/test/hold',
  link: {
    id: { like: 'string', size: 32 },
    source: { like: 'language_flow_variant' },
    target: { like: 'language_flow_variant' },
  },
}

export const language_flow_sense: Form = {
  form: 'form',
  save: '~/test/hold',
  link: {
    id: { like: 'string', size: 32 },
    variant: { like: 'language_flow_variant' },
    parent: { like: 'language_flow_sense', need: false },
    position: { like: 'integer', need: false, fall: 0 },
  },
}

export const language_flow_gloss: Form = {
  form: 'form',
  save: '~/test/hold',
  link: {
    id: { like: 'string', size: 32 },
    variant: { like: 'language_flow_variant' },
    fragments: { like: 'language_flow_gloss_fragment', list: true },
  },
}

export const language_flow_gloss_fragment: Form = {
  form: 'form',
  save: '~/test/hold',
  link: {
    id: { like: 'string', size: 32 },
    text: { like: 'string' },
    symbols: { like: 'string' },
  },
}

export const audio_recording: Form = {
  form: 'form',
  save: '~/test/hold',
  link: {
    citation: { like: 'citation' },
    file: { like: 'audio_file' },
  },
}

export const language_flow_pronunciation: Form = {
  form: 'form',
  save: '~/test/hold',
  link: {
    id: { like: 'string', size: 32 },
    script: { like: 'script' },
    system: { like: 'transliteration_system' },
    variant: { like: 'language_flow_variant' },
    text: { like: 'language_flow_variant' },
    position: { like: 'integer', need: false, fall: 0 },
    syllable: {
      need: false,
      link: {
        count: { like: 'integer', need: false },
        mark: { like: 'json', need: false },
        is_exact: { like: 'boolean', need: false },
      },
    },
    recordings: { like: 'audio_recording', list: true },
  },
}

export const language_flow_transcription: Form = {
  form: 'form',
  save: '~/test/hold',
  link: {
    id: { like: 'string', size: 32 },
    script: { like: 'script' },
    system: { like: 'transliteration_system' },
    variant: { like: 'language_flow_variant' },
    text: { like: 'string' },
    position: { like: 'integer', need: false, fall: 0 },
    is_phonetic: { like: 'boolean', need: false, fall: false },
    is_canonical: { like: 'boolean', need: false },
  },
}

export const transliteration_system: Form = {
  form: 'form',
  save: '~/test/hold',
  link: {
    id: { like: 'string', size: 32 },
    slug: { like: 'string' },
    title: { like: 'string' },
    source: {
      link: {
        language: { like: 'language' },
        script: { like: 'language' },
      },
    },
    target: {
      link: {
        language: { like: 'language' },
        script: { like: 'language' },
      },
    },
  },
}

export const language_flow_element: Form = {
  form: 'form',
  save: '~/test/hold',
  link: {
    id: { like: 'string', size: 32 },
    derivation: { like: 'language_flow_derivation' },
    source: { like: 'language_flow_variant' },
  },
}

export const language_flow_derivation: Form = {
  form: 'form',
  save: '~/test/hold',
  link: {
    id: { like: 'string', size: 32 },
    base: { like: 'language_flow_variant' },
    category: { like: 'string' },
  },
}

export const language_flow_variant_structure: List = {
  form: 'list',
  save: '~/test/hold',
  list: ['task', 'object', 'design', 'other', 'unknown'],
}

export const language_flow_variant_role: List = {
  form: 'list',
  save: '~/test/hold',
  list: [
    'noun',
    'verb',
    'coverb',
    'adjective',
    'pronoun',
    'preposition',
    'suffix',
    'infix',
    'prefix',
    'adverb',
    'participle',
    'particle',
    'article',
    'determiner',
    'numeral',
    'conjunction',
    'interjection',
    'auxiliary_verb',
    'clitic',
    'marker',
    'copula',
    'gerund',
    'acronym',
    'demonstrative',
  ],
}

export const language_flow_variant_tense: List = {
  form: 'list',
  save: '~/test/hold',
  list: ['past', 'present', 'future', 'nonpast', 'nonfuture'],
}

export const language_flow_variant_relativity: List = {
  form: 'list',
  save: '~/test/hold',
  list: ['relative', 'absolute'],
}

export const language_flow_variant_concreteness: List = {
  form: 'list',
  save: '~/test/hold',
  list: ['abstract', 'concrete'],
}

export const language_flow_variant_continuity: List = {
  form: 'list',
  save: '~/test/hold',
  list: [
    'bounded',
    'ongoing',
    'repetitive',
    'continuous',
    'fixed',
    'evolving',
  ],
}

export const language_flow_variant: Form = {
  form: 'form',
  save: '~/test/hold',
  link: {
    id: { like: 'string', size: 32 },
    flow: { like: 'language_flow', need: false },
    context: { like: 'integer', need: false },
    // - is_derived: If it is a derived word from a base.
    is_derived: { like: 'boolean', need: false },
    // - is_compound: If it is a compound word.
    is_compound: { like: 'boolean', need: false },
    // - is_base: In agglutinative languages, the base word.
    is_base: { like: 'boolean', need: false },
    // If the concept can't be broken down further (create is, creates isn't, creationism is).
    is_anchor: { like: 'boolean', need: false },
    // - is_word: If it's a word.
    is_word: { like: 'boolean', need: false },
    // - is_multi_word: If it's a term which is more than one word.
    is_multi_word: { like: 'boolean', need: false },
    // - is_affix
    is_affix: { like: 'boolean', need: false },
    is_prefix: { like: 'boolean', need: false },
    is_suffix: { like: 'boolean', need: false },
    is_infix: { like: 'boolean', need: false },
    is_circumfix: { like: 'boolean', need: false },
    // - is_prefix
    // - has_prefix
    // - has_suffix
    // - is_flow: Appears in the dictionary word list.
    is_flow: { like: 'boolean', need: false },
    // - is_verse
    // - is_paragraph
    // - is_sentence
    // - is_phrase
    // - is_idiom
    // - is_punctuation
    is_punctuation: { like: 'boolean', need: false },
    punctuation_type: { like: 'string', need: false },
    // - punctuation = stop, break, start_enclosure, etc..
    // - is_function (function words)
    is_function: { like: 'boolean', need: false },
    // - is_content (content words)
    is_content: { like: 'boolean', need: false },
    // - is_reference (determiner is is_reference + is_modifier)
    is_reference: { like: 'boolean', need: false },
    // - is_quantity (many/few = is_reference,is_modifier,is_quantity)
    is_quantity: { like: 'boolean', need: false },
    // - is_numeral
    is_numeral: { like: 'boolean', need: false },
    // - is_action: Verbs
    is_action: { like: 'boolean', need: false },
    // - is_object: Nouns
    is_object: { like: 'boolean', need: false },
    // - is_modifier
    is_modifier: { like: 'boolean', need: false },
    // - is_feature # adjective / adverb
    is_feature: { like: 'boolean', need: false },
    // - modify: action | object
    modifies: { like: 'string', need: false },
    // - person: 1, 2, 3
    // - is_sentence_subject (I)
    is_sentence_subject: { like: 'boolean', need: false },
    // - is_sentence_object (me)
    is_sentence_object: { like: 'boolean', need: false },
    // - is_substitute (I = is_substitute,is_object,is_sentence_subject)
    is_substitute: { like: 'boolean', need: false },
    // - is_possessive (my = is_substitute,is_object,is_possessive)
    is_possessive: { like: 'boolean', need: false },
    // - is_dependent (modal verbs)
    is_dependent: { like: 'boolean', need: false },
    // - voice
    // - is_manner
    // - manner: likelihood, possibility, ability, permission, request,
    //   obligation, capacity, suggestion
    //   - could (is_manner,is_modifier,modify=action,is_action)
    // - syntactic_role: subject, predicate, object, complement, adjunct
    // - semantic_role: agent, patient, experiencer, instrument, etc.:
    //   Capturing the role entities play in events or states.
    // - degree (comparative, superlative): For adjectives and adverbs.
    // - politeness, formality, emphasis, hesitation
    // - formal, informal, technical, colloquial
    //   - formality
    //   - usage: technical, colloquial, literary
    //   - is_archaic
    // - is_metaphor
    // - is_simile
    // - is_interjection
    // - is_filler
    // - is_link (conjunction/disjunction)
    // - relation
    //   - kind: similar, opposite, inclusion, containment (synonymy, antonymy,
    //     hyponymy, meronymy)
    // - concreteness, animacy, countability
    // - is_negation
    // - is_plural, is_singular, is_dual
    // - is_transfer (transitive=true, intransitive=false)
    // - aspect: perfective, imperfective, progressive
    // - is_irregular
    // - Pronoun Features: type: personal, demonstrative, interrogative,
    //   relative, etc.
    // - is_reflective (reflexive pronouns)
    // - clause_type: main, subordinate, relative, coordinate, etc.
    // - is_topic: Marks the topic of a sentence or clause.
    // - is_focus: Marks the focus or emphasis.
    // - speech_act: question, command, statement, etc.
    // - attitude: sarcasm, irony, sincerity, etc.
    // - is_obsolete: marks words no longer in common use.
    // - is_error: marks erroneous usage in the text.
    // - correction: provides the correct form or usage.
    // - is_spatial
    // - is_temporal
    // - is_movement (directional)
    // - is_technique (by, with)
    // - is_causal
    // - is_invariable (doesn't ever change form)
    // - is_flexible_position: For languages where the position (pre or post)
    //   of the adposition can vary.
    // - is_phrase_component
    // - is_principle_part
    // - flow: link to the flow where this appears

    // await db.schema
    //   .createTable('language_flow_rhyme')
    //   .addColumn('id', 'uuid', c => c.primaryKey())
    //   .addColumn('source__id', 'uuid', c =>
    //     c.references('language_flow_tone.id').notNull(),
    //   )
    //   .addColumn('target__id', 'uuid', c =>
    //     c.references('language_flow_tone.id').notNull(),
    //   )
    //   .execute()

    has_predictable_meaning: { like: 'boolean', need: false },
    structure: {
      like: 'language_flow_variant_structure',
      need: false,
    },
    role: { like: 'language_flow_variant_role', need: false },
    arity: { like: 'integer', need: false },
    tense: { like: 'language_flow_variant_tense', need: false },
    relativity: {
      like: 'language_flow_variant_relativity',
      need: false,
    },
    concreteness: {
      like: 'language_flow_variant_concreteness',
      need: false,
    },
    continuity: {
      like: 'language_flow_variant_continuity',
      need: false,
    },
  },
}

export const language_flow: Form = {
  form: 'form',
  save: '~/test/hold',
  link: {
    id: { like: 'string', size: 32 },
    slug: { like: 'string' },
    text: { like: 'string' },
    language: { like: 'language' },
    variants: { like: 'language_flow_variant', list: true },
  },
}
