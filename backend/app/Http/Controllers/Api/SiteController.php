<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SiteSetting;
use Illuminate\Http\Request;

class SiteController extends Controller
{
    public function show()
    {
        $content = SiteSetting::publicContent();

        return response()->json(['company' => $content, 'pages' => $content['pages'], 'chat_enabled' => filled(config('services.openai.key')) && filled(config('services.openai.model'))]);
    }

    public function update(Request $request)
    {
        $rules = [
            'name' => 'required|string|max:100', 'city' => 'required|string|max:255',
            'email' => 'required|email|max:255', 'phone' => 'nullable|string|max:50',
            'address' => 'nullable|string|max:500', 'hours' => 'nullable|string|max:255',
            'maps_url' => ['nullable', 'url:https', 'max:1000', 'regex:~^https://(www\.google\.[a-z.]+/maps|maps\.google\.[a-z.]+/|maps\.app\.goo\.gl/|goo\.gl/maps/)~'],
            'history' => 'required|string|max:10000', 'mission' => 'required|string|max:2000', 'vision' => 'required|string|max:2000',
            'objectives' => 'required|array|min:1|max:10', 'objectives.*' => 'required|string|max:500',
            'team' => 'present|array|max:30', 'team.*' => 'array:name,role,bio,photo_url',
            'team.*.name' => 'required|string|max:150', 'team.*.role' => 'required|string|max:150',
            'team.*.bio' => 'nullable|string|max:1500',
            'team.*.photo_url' => 'nullable|url:https|max:1000',
            'pages' => 'sometimes|array:home,about,contact,footer',
            'pages.home.method_steps' => 'sometimes|array|min:1|max:8',
            'pages.home.method_steps.*' => 'array:number,title,text',
            'pages.home.method_steps.*.number' => 'required|string|max:10',
            'pages.home.method_steps.*.title' => 'required|string|max:100',
            'pages.home.method_steps.*.text' => 'required|string|max:500',
        ];
        foreach (config('axora.pages') as $page => $fields) {
            $rules['pages.'.$page] = 'sometimes|array:'.implode(',', array_keys($fields));
            foreach ($fields as $field => $value) {
                if (is_array($value)) {
                    continue;
                }
                $isImage = in_array($field, ['hero_image', 'story_image', 'image']);
                $rules['pages.'.$page.'.'.$field] = $isImage ? 'sometimes|nullable|url:https|max:1000' : 'sometimes|required|string|max:1000';
            }
        }
        $data = $request->validate($rules);
        $pages = SiteSetting::publicContent()['pages'];
        foreach ($data['pages'] ?? [] as $page => $fields) {
            $pages[$page] = array_replace($pages[$page], $fields);
        }
        $data['pages'] = $pages;
        $setting = SiteSetting::query()->orderBy('id')->first();
        if ($setting) {
            $setting->update(['content' => $data]);
        } else {
            SiteSetting::create(['content' => $data]);
        }

        return $this->show();
    }
}
