'use strict';

// fixme: we will move this into a separate package so can be used by
// producers and consumers. Also maybe use jsonschema, so java and
// whatever can use the schema.

const Joi = require('joi');

const contentSchema = Joi
    .object().keys({
        html: Joi.string().required(),
        assetId: Joi.string().optional(),
        // fixme: this should be a collection of assets presumably?
        // Keepeing it like this to unbreak other packages. In future,
        // maybe something like
        // assets: Joi.array().items(Joi.string()).optional()
    })
    .unknown(false);

/**
 * Resouce entries describe resources that a podlet exposes as URLs.
 * For example a recommendations podlet, like the one on the frontpage
 * might have the resources `/realestate-recommendations.json` and
 * `/job-recommendations.json`.
 *
 * Since we want frontend JS, that is code that is running in the browser
 * to know the paths it should communicate with, it becomes important that
 * these resources define paths that will be proxied all the way out to
 * the layout server.
 *
 * What the manifest is really saying is, "the client expects to find
 * a resource on this path". And then any code using the podlet needs
 * to honour this by proxying that exact path.
 *
 * For this reason, we should probably put podlet-id and version in
 * paths.
 */
const resourceEntry = Joi
    .object().keys({
        path: Joi
            .string()
            .required(),
        method: Joi
            .string()
            .default('GET')
            .optional(),
        params: Joi.array()
            .optional()
            .items(Joi.string()),
    })
    .unknown(false);

const resourceMountEntry = Joi
    .object().keys({
        path: Joi
            .string()
            .required(),
        method: Joi
            .string()
            .default('GET')
            .optional(),
        params: Joi.array()
            .optional()
            .items(Joi.string()),
        resolver: Joi.func(),
    })
    .unknown(false);
const maxAge = Joi
    .number()
    .unit('seconds')
    .min(0)
    .max(60 * 60 * 60)
    .required();

const maxDataAge = Joi
    .number()
    .unit('seconds')
    .min(0)
    .max(60 * 60 * 60)
    .less(Joi.ref('maxAge'))
    .optional();

const metadataSchema = Joi
    .object().keys({
        fallbacks: Joi
            .object()
            .pattern(/.*/, contentSchema),
        fallback: contentSchema,
        maxDataAge,
        maxAge,
        resources: Joi
            .array()
            .items(resourceEntry)
            .optional(),
    })
    .xor('fallback', 'fallbacks')
    .unknown(false);

const responseSchema = Joi
    .object().keys({
        id: Joi.string().required(),
        version: Joi.string().required(),
        data: contentSchema.required(),
        metadata: metadataSchema.optional(),
    })
    .unknown(false);

const hostOptionsSchema = Joi.object().keys({
    id: Joi.string().required(),
    version: Joi.string().required(),
    maxAge,
    maxDataAge,
    args: Joi.object().optional(),
    fallbackArgs: Joi.object().optional(), // fixme todo! to think this through
    entrypoints: Joi.array().items(Joi.string()),
    resources: Joi.array()
        .default([])
        .items(resourceMountEntry),
    render: Joi.func().required(),
});

module.exports.hostOptionsSchema = hostOptionsSchema;
module.exports.metadataSchema = metadataSchema;
module.exports.responseSchema = responseSchema;
