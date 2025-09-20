import {defineField, defineType} from 'sanity'

export const mediaLibrary = defineType({
  name: 'mediaLibrary',
  title: 'Media Library',
  type: 'document',
  fields: [
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: 'company',
      type: 'number',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'publishedAt',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'alt',
      title: 'Alt Text',
      type: 'string',
    }),
    defineField({
      name: 'caption',
      title: 'Caption',
      type: 'string',
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'string',
    }),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{type: 'string'}],
      options: {
        layout: 'tags'
      }
    }),
    defineField({
      name: 'pending_partner',
      title: 'Pending Partner',
      type: 'boolean',
    }),
    defineField({
      name: 'partner',
      title: 'partner',
      type: 'boolean',
    }),
    defineField({
      name: 'hiring_tags',
      title: 'Hiring Tags',
      type: 'array',
      of: [{type: 'string'}],
      options: {
        layout: 'tags'
      }
    }),
    defineField({
      name: 'external_media',
      title: 'External Media',
      type: 'string',
    }),
    {
    name: 'people',
    type: 'array',
    title: 'Team Members',
    of: [
      {
        type: 'object',
        fields: [
          {
            name: 'name',
            type: 'string',
            title: 'Full Name'
          },
          {
            name: 'media_url',
            type: 'url',
            title: 'Personal Website Media URL'
          }
        ]
      }
    ]
  }
  ],
  preview: {
    select: {
      title: 'caption',
      media: 'image'
    },
    prepare({title, media}) {
      return {
        title: title || 'Untitled Image',
        media,
      }
    }
  }
})
